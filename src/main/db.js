"use strict";
// Database connectors for the DB widget (a mini DataGrip). Drivers are loaded
// lazily so the app runs even if a driver isn't installed. Pure-JS drivers
// (pg, mysql2) — no native build. Designed to add more (sqlite, mssql) later.

const connections = new Map();
let seq = 0;

const drivers = {
    postgres: {
        async connect(cfg) {
            const { Client } = require("pg");
            const client = new Client({
                host: cfg.host || "127.0.0.1",
                port: cfg.port || 5432,
                user: cfg.user,
                password: cfg.password,
                database: cfg.database,
                ssl: cfg.ssl ? { rejectUnauthorized: false } : undefined,
                connectionTimeoutMillis: 8000,
                statement_timeout: 20000
            });
            await client.connect();
            const v = await client.query("SELECT version()");
            return { client, version: v.rows[0].version };
        },
        async query(client, sql, params) {
            const r = await client.query(sql, params || []);
            const rows = Array.isArray(r) ? r[r.length - 1] : r;
            return {
                columns: (rows.fields || []).map(f => f.name),
                rows: rows.rows || [],
                rowCount: rows.rowCount != null ? rows.rowCount : (rows.rows ? rows.rows.length : 0),
                command: rows.command
            };
        },
        async close(client) { await client.end(); }
    },
    mysql: {
        async connect(cfg) {
            const mysql = require("mysql2/promise");
            const client = await mysql.createConnection({
                host: cfg.host || "127.0.0.1",
                port: cfg.port || 3306,
                user: cfg.user,
                password: cfg.password,
                database: cfg.database,
                ssl: cfg.ssl ? { rejectUnauthorized: false } : undefined,
                connectTimeout: 8000
            });
            const [rows] = await client.query("SELECT VERSION() AS v");
            return { client, version: rows[0].v };
        },
        async query(client, sql, params) {
            const [rows, fields] = await client.query(sql, params || []);
            if (Array.isArray(rows)) {
                return {
                    columns: (fields || []).map(f => f.name),
                    rows,
                    rowCount: rows.length
                };
            }
            // Non-SELECT (OkPacket)
            return { columns: ["affectedRows"], rows: [{ affectedRows: rows.affectedRows }], rowCount: rows.affectedRows };
        },
        async close(client) { await client.end(); }
    }
};

function register(ipcMain) {
    ipcMain.handle("db:connect", async (e, cfg = {}) => {
        const drv = drivers[cfg.type];
        if (!drv) return { error: `Unknown database type: ${cfg.type}` };
        try {
            const { client, version } = await drv.connect(cfg);
            const id = "db" + (++seq);
            connections.set(id, { type: cfg.type, client });
            return { id, type: cfg.type, version };
        } catch (err) {
            return { error: err.message || String(err) };
        }
    });

    ipcMain.handle("db:query", async (e, id, sql, params) => {
        const conn = connections.get(id);
        if (!conn) return { error: "Not connected" };
        const drv = drivers[conn.type];
        const t0 = Date.now();
        try {
            const res = await drv.query(conn.client, sql, params);
            res.elapsedMs = Date.now() - t0;
            return res;
        } catch (err) {
            return { error: err.message || String(err) };
        }
    });

    ipcMain.handle("db:close", async (e, id) => {
        const conn = connections.get(id);
        if (!conn) return true;
        try { await drivers[conn.type].close(conn.client); } catch (err) { /* ignore */ }
        connections.delete(id);
        return true;
    });
}

module.exports = { register };
