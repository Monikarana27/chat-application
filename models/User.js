const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    // Create new user with hashed password
    static async create(username, email, password) {
        try {
            const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
            const [result] = await db.execute(
                'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
                [username, email, hashedPassword]
            );
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // Find user by email for login
    static async findByEmail(email) {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Find user by username
    static async findByUsername(username) {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM users WHERE username = ?',
                [username]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Find user by ID
    static async findById(id) {
        try {
            const [rows] = await db.execute(
                'SELECT id, username, email, avatar_url, is_online, created_at FROM users WHERE id = ?',
                [id]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Update online status
    static async setOnlineStatus(userId, isOnline) {
        try {
            await db.execute(
                'UPDATE users SET is_online = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?',
                [isOnline, userId]
            );
        } catch (error) {
            throw error;
        }
    }

    // Get users in a specific room
    static async getUsersInRoom(roomName) {
        try {
            const [rows] = await db.execute(`
                SELECT DISTINCT u.id, u.username, u.is_online, u.avatar_url
                FROM users u
                JOIN active_sessions s ON u.id = s.user_id
                WHERE s.room_name = ?
                ORDER BY u.username
            `, [roomName]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Verify password
    static async verifyPassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }
}

module.exports = User;