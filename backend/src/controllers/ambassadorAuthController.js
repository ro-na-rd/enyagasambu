const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { applyReferral } = require('./referralController');
const { logger } = require('../config/logger');

const CERT_PRICE = 2000;

const signToken = (user) =>
    jwt.sign({ id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN }
    );

exports.register = async(req, res) => {
    const { name, email, phone, password, referral_code } = req.body;

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Check for duplicate email
        const [existingEmail] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingEmail.length > 0) {
            await conn.rollback();
            return res.status(409).json({ message: 'Email already in use' });
        }

        // Check for duplicate phone (if provided)
        if (phone) {
            const [existingPhone] = await conn.query('SELECT id FROM users WHERE phone = ?', [phone]);
            if (existingPhone.length > 0) {
                await conn.rollback();
                return res.status(409).json({ message: 'Phone number already in use' });
            }
        }

        const password_hash = await bcrypt.hash(password, 12);
        const [result] = await conn.query(
            'INSERT INTO users (name, email, phone, password_hash, coins, role) VALUES (?, ?, ?, ?, ?, ?)', [name, email, phone || null, password_hash, 0, 'ambassador']
        );

        // Create initial certificate request
        await conn.query(
            'INSERT INTO ambassador_certificates (user_id, status, amount_rwf) VALUES (?, ?, ?)', [result.insertId, 'pending', CERT_PRICE]
        );

        // Apply referral code if provided
        if (referral_code) {
            await applyReferral(conn, result.insertId, referral_code.toUpperCase());
        }

        await conn.commit();

        const [[user]] = await pool.query('SELECT id, name, email, phone, coins, role, created_at FROM users WHERE id = ?', [result.insertId]);

        const token = signToken({ id: result.insertId, email, role: 'ambassador' });
        return res.status(201).json({
            message: 'Ambassador account created successfully',
            token,
            user: user,
        });
    } catch (err) {
        await conn.rollback();
        logger.error('[Ambassador register error]', err);
        return res.status(500).json({ message: 'Server error' });
    } finally {
        conn.release();
    }
};

exports.login = async(req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await pool.query(
            'SELECT id, name, email, phone, password_hash, coins, role FROM users WHERE email = ? AND role = ?', [email, 'ambassador']
        );
        if (rows.length === 0) return res.status(401).json({ message: 'Invalid email or password' });

        const user = rows[0];
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ message: 'Invalid email or password' });

        const token = signToken(user);
        const { password_hash, ...safeUser } = user;
        return res.json({ token, user: safeUser });
    } catch (err) {
        logger.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
};

exports.me = async(req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, name, email, phone, coins, role, referral_code, can_post_free, created_at FROM users WHERE id = ?', [req.user.id]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
        return res.json({ user: rows[0] });
    } catch (err) {
        logger.error('[Ambassador me error]', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

exports.updateProfile = async(req, res) => {
    const { name, phone } = req.body;
    try {
        const updates = [];
        const params = [];
        
        if (name) {
            updates.push('name = ?');
            params.push(name);
        }
        if (phone) {
            // Check if phone is already used by another user
            const [existing] = await pool.query('SELECT id FROM users WHERE phone = ? AND id != ?', [phone, req.user.id]);
            if (existing.length > 0) {
                return res.status(409).json({ message: 'Phone number already in use' });
            }
            updates.push('phone = ?');
            params.push(phone);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }
        
        params.push(req.user.id);
        await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
        
        const [[user]] = await pool.query(
            'SELECT id, name, email, phone, coins, role, referral_code, created_at FROM users WHERE id = ?',
            [req.user.id]
        );
        
        return res.json({ message: 'Profile updated', user });
    } catch (err) {
        logger.error('[Ambassador updateProfile error]', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

exports.changePassword = async(req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    
    try {
        const [[user]] = await pool.query(
            'SELECT password_hash FROM users WHERE id = ?',
            [req.user.id]
        );
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const isValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }
        
        const newPasswordHash = await bcrypt.hash(newPassword, 12);
        await pool.query(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [newPasswordHash, req.user.id]
        );
        
        return res.json({ message: 'Password changed successfully' });
    } catch (err) {
        logger.error('[Ambassador changePassword error]', err);
        return res.status(500).json({ message: 'Server error' });
    }
};