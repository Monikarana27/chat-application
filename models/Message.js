const db = require('../config/database');

class Message {
    // Save message to database
    static async create(userId, roomName, message, messageType = 'text') {
        try {
            // Get room ID first
            const [roomRows] = await db.execute(
                'SELECT id FROM rooms WHERE name = ?',
                [roomName]
            );
            
            if (roomRows.length === 0) {
                throw new Error('Room not found');
            }

            const roomId = roomRows[0].id;
            
            const [result] = await db.execute(
                'INSERT INTO messages (user_id, room_id, message, message_type) VALUES (?, ?, ?, ?)',
                [userId, roomId, message, messageType]
            );
            
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // Get recent messages for a room
    static async getRecentMessages(roomName, limit = 50) {
        try {
            const [rows] = await db.execute(`
                SELECT m.*, u.username, u.avatar_url,
                       CONVERT_TZ(m.timestamp, '+00:00', '+06:00') as local_time
                FROM messages m 
                JOIN users u ON m.user_id = u.id 
                JOIN rooms r ON m.room_id = r.id
                WHERE r.name = ? AND m.is_deleted = FALSE
                ORDER BY m.timestamp DESC 
                LIMIT ?
            `, [roomName, limit]);
            
            return rows.reverse(); // Show oldest first
        } catch (error) {
            throw error;
        }
    }

    // Search messages in a room
    static async searchMessages(roomName, searchTerm, limit = 20) {
        try {
            const [rows] = await db.execute(`
                SELECT m.*, u.username,
                       CONVERT_TZ(m.timestamp, '+00:00', '+06:00') as local_time
                FROM messages m 
                JOIN users u ON m.user_id = u.id 
                JOIN rooms r ON m.room_id = r.id
                WHERE r.name = ? AND m.is_deleted = FALSE
                AND MATCH(m.message) AGAINST(? IN NATURAL LANGUAGE MODE)
                ORDER BY m.timestamp DESC 
                LIMIT ?
            `, [roomName, searchTerm, limit]);
            
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Get message count for a room
    static async getMessageCount(roomName) {
        try {
            const [rows] = await db.execute(`
                SELECT COUNT(*) as count
                FROM messages m 
                JOIN rooms r ON m.room_id = r.id
                WHERE r.name = ? AND m.is_deleted = FALSE
            `, [roomName]);
            
            return rows[0].count;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Message;