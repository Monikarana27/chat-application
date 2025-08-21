const db = require('../config/database');

class Session {
    // Create active session
    static async create(sessionId, userId, socketId, roomName, ipAddress, userAgent) {
        try {
            await db.execute(
                `INSERT INTO active_sessions (session_id, user_id, socket_id, room_name, ip_address, user_agent)
                 VALUES (?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE 
                 socket_id = VALUES(socket_id),
                 room_name = VALUES(room_name),
                 last_activity = CURRENT_TIMESTAMP`,
                [sessionId, userId, socketId, roomName, ipAddress, userAgent]
            );
        } catch (error) {
            throw error;
        }
    }

    // Update session activity
    static async updateActivity(sessionId, socketId, roomName) {
        try {
            await db.execute(
                'UPDATE active_sessions SET socket_id = ?, room_name = ?, last_activity = CURRENT_TIMESTAMP WHERE session_id = ?',
                [socketId, roomName, sessionId]
            );
        } catch (error) {
            throw error;
        }
    }

    // Remove session
    static async remove(sessionId) {
        try {
            await db.execute(
                'DELETE FROM active_sessions WHERE session_id = ?',
                [sessionId]
            );
        } catch (error) {
            throw error;
        }
    }

    // Get session by socket ID
    static async findBySocketId(socketId) {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM active_sessions WHERE socket_id = ?',
                [socketId]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Clean old sessions (older than 24 hours)
    static async cleanOldSessions() {
        try {
            await db.execute(
                'DELETE FROM active_sessions WHERE last_activity < DATE_SUB(NOW(), INTERVAL 24 HOUR)'
            );
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Session;