/**
 * NodeSqlite3MemoryDbProvider.ts
 * Author: David de Regt
 * Copyright: Microsoft 2015
 *
 * NoSqlProvider provider setup for NodeJs to use an in-memory sqlite3-based provider.
 * Largely only used for unit tests.
 */
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var SyncTasks = require('synctasks');
var SqlProviderBase = require('./SqlProviderBase');
var NodeSqlite3MemoryDbProvider = (function (_super) {
    __extends(NodeSqlite3MemoryDbProvider, _super);
    function NodeSqlite3MemoryDbProvider(sqlite3) {
        _super.call(this);
        this._sqlite3 = sqlite3;
    }
    NodeSqlite3MemoryDbProvider.prototype.open = function (dbName, schema, wipeIfExists, verbose) {
        _super.prototype.open.call(this, dbName, schema, wipeIfExists, verbose);
        if (!this._sqlite3) {
            return SyncTasks.Rejected('No support for react native sqlite in this environment');
        }
        this._sqlite3.verbose();
        this._db = new this._sqlite3.Database(':memory:');
        return this._ourVersionChecker(wipeIfExists);
    };
    NodeSqlite3MemoryDbProvider.prototype.openTransaction = function (storeNames, writeNeeded) {
        return SyncTasks.Resolved(this._getTransaction());
    };
    NodeSqlite3MemoryDbProvider.prototype.close = function () {
        var _this = this;
        var task = SyncTasks.Defer();
        this._db.close(function (err) {
            _this._db = null;
            if (err) {
                task.reject(err);
            }
            else {
                task.resolve();
            }
        });
        return task.promise();
    };
    NodeSqlite3MemoryDbProvider.prototype._getTransaction = function () {
        return new NodeSqlite3Transaction(this._db, this._schema, this._verbose);
    };
    return NodeSqlite3MemoryDbProvider;
})(SqlProviderBase.SqlProviderBase);
exports.NodeSqlite3MemoryDbProvider = NodeSqlite3MemoryDbProvider;
var NodeSqlite3Transaction = (function (_super) {
    __extends(NodeSqlite3Transaction, _super);
    function NodeSqlite3Transaction(db, schema, verbose) {
        _super.call(this, schema, verbose);
        // TODO dadere (#333862): Make this an actual transaction
        this._db = db;
    }
    NodeSqlite3Transaction.prototype.runQuery = function (sql, parameters) {
        var deferred = SyncTasks.Defer();
        if (this._verbose) {
            console.log('Query: ' + sql);
        }
        var stmt = this._db.prepare(sql);
        stmt.bind.apply(stmt, parameters);
        stmt.all(function (err, rows) {
            if (err) {
                console.log('Query Error: SQL: ' + sql + ', Error: ' + err.toString());
                deferred.reject(err);
                return;
            }
            deferred.resolve(rows);
        });
        return deferred.promise();
    };
    NodeSqlite3Transaction.prototype.getResultsFromQueryWithCallback = function (sql, parameters, callback) {
        var deferred = SyncTasks.Defer();
        if (this._verbose) {
            console.log('Query: ' + sql);
        }
        var stmt = this._db.prepare(sql);
        stmt.bind.apply(stmt, parameters);
        stmt.each(function (err, row) {
            if (err) {
                console.log('Query Error: SQL: ' + sql + ', Error: ' + err.toString());
                deferred.reject(err);
                return;
            }
            callback(JSON.parse(row.nsp_data));
        }, function (err, count) {
            if (err) {
                console.log('Query Error: SQL: ' + sql + ', Error: ' + err.toString());
                deferred.reject(err);
                return;
            }
            deferred.resolve();
        });
        return deferred.promise();
    };
    return NodeSqlite3Transaction;
})(SqlProviderBase.SqlTransaction);
