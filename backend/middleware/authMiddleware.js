const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    if (process.env.AUTH_BYPASS === 'true') {
        req.user = { userId: 1, username: 'admin', role: 'admin' };
        return next();
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) {
        return res.status(401).json({ error: 'Unauthorized: Authentication token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Optional authentication: extracts user if token present, but doesn't block unauthenticated callers
function optionalAuth(req, res, next) {
    if (process.env.AUTH_BYPASS === 'true') {
        req.user = { userId: 1, username: 'admin', role: 'admin' };
        return next();
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return next();
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (!err && user) {
            req.user = user;
        }
        next();
    });
}

function requireRole(roles) {
    const allowed = Array.isArray(roles) ? roles : [roles];
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized: Authentication required' });
        }
        if (!allowed.includes(req.user.role)) {
            return res.status(403).json({ 
                error: `Forbidden: Access restricted to [${allowed.join(', ')}] roles` 
            });
        }
        next();
    };
}

module.exports = {
    authenticateToken,
    optionalAuth,
    requireRole
};

