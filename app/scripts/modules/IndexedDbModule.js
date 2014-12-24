/**
 * IndexedDB 模块
 */
'use strict';

angular.module('indexedDB',[])
	.factory('IndexedDB',['$q', function($q){
		var service = {
			DB_NAME: 'DataBase',
			DB_VERSION: 2,
			STORE_WORK: 'workRecords',
			STORE_RESTAURANTS: 'restaurants',
			STORE_OA_MESSAGES: 'oaMessages',
			STORE_LUNCH: 'lunchRecords'
		};
		/**
		 * 打开数据库
		 * @returns {Function|promise}
		 */
		service.getDB = function(){
			var deferred = $q.defer();
			if(service.db){
				//db已打开，直接返回成功
				deferred.resolve(service.db);
			}else{
				//打开DB
				var request = indexedDB.open(service.DB_NAME,service.DB_VERSION);
				request.onerror = function(e) {
					//打开失败
					console.log('打开数据库异常:'+ e.target.errorCode);
					deferred.reject('打开数据库异常:' + e.target.errorCode);
				};
				request.onsuccess = function(e) {
					//打开成功
					console.log('打开数据库成功');
					service.db = e.target.result;
					deferred.resolve(service.db);
				};
				request.onupgradeneeded = function(e) {
					var db = e.target.result;
					if(db.objectStoreNames.contains('records')) {
						db.deleteObjectStore('records');
					}
					if(db.objectStoreNames.contains('restaurants')) {
						db.deleteObjectStore('restaurants');
						//清除数据同时清除版本号
						chrome.storage.local.remove('__RESTAURANT_VERSION');
					}
					if(db.objectStoreNames.contains('messages')) {
						db.deleteObjectStore('messages');
					}
					createObjectStore(db);
				};
			}
			return deferred.promise;
		};
		/**
		 * 创建数据结构
		 * @param db
		 */
		function createObjectStore(db){
			console.log('创建表结构');
			//创建考勤记录表
			var storeRecord = db.createObjectStore(service.STORE_WORK, {keyPath: 'date', autoIncrement: false});
			storeRecord.createIndex('date', 'date', {unique: true});
			//创建外卖数据表
			var storeRestaurant = db.createObjectStore(service.STORE_RESTAURANTS, {keyPath: 'name', autoIncrement: false});
			storeRestaurant.createIndex('name', 'name', {unique: true});
			//创建OA系统消息表
			var storeMessage = db.createObjectStore(service.STORE_OA_MESSAGES, {keyPath: 'id', autoIncrement: true});
			storeMessage.createIndex('senderName', 'N', {unique: false});
			storeMessage.createIndex('senderId', 'S', {unique: false});
			storeMessage.createIndex('messageType', 'T', {unique: false});
			//创建订餐记录表
			var storeLunch = db.createObjectStore(service.STORE_LUNCH, {keyPath: 'orderId', autoIncrement: false});
			storeLunch.createIndex('date', 'orderDate', {unique: false});
			console.log('数据库创建成功！');
		}
		/**
		 * 插入数据
		 * @param objectStoreName 表名
		 * @param data 待插入数据
		 * @returns {Function|promise}
		 */
		service.insert = function(objectStoreName,data){
			var deferred = $q.defer();
			if(objectStoreName && data){
				//检查db是否打开
				service.getDB().then(function(db){
					//打开数据仓库
					var transaction = db.transaction(objectStoreName,'readwrite');
					var store = transaction.objectStore(objectStoreName);
					if(angular.isArray(data)){
						var count = 0;
						transaction.oncomplete  = function(){
							console.log('更新完成，成功条数：%s',count);
							deferred.resolve({msg:'更新完成',count:count});
						};
						transaction.onerror = function(e){
							deferred.notify('插入操作失败%O',e);
							e.preventDefault();
						};
						for(var i in data){
							var req = store.add(data[i]);
							req.onsuccess = function(){
								count++;
								deferred.notify('插入数据成功！数据：%O', data[i]);
							};
						}
					}else{
						//插入数据
						var req = store.add(data);
						req.onsuccess = function(){
							deferred.resolve('插入数据成功！');
						}
						req.onerror = function(){
							deferred.reject('插入数据失败');
						}
					}
				},function(err){
					//打开数据库失败
					deferred.reject(err);
				});
			}else{
				//传入参数不存在
				deferred.reject('参数不全');
			}
			return deferred.promise;
		};
		/**
		 * 更新数据
		 * @param objectStoreName 表名
		 * @param data 待更新数据
		 * @returns {Function|promise}
		 */
		service.update = function(objectStoreName,data){
			var deferred = $q.defer();
			if(objectStoreName && data){
				//检查db是否打开
				service.getDB().then(function(db){
					//打开数据仓库
					var transaction = db.transaction(objectStoreName,'readwrite');
					transaction.oncomplete  = function(){
						deferred.resolve('更新完成');
					};
					transaction.onerror = function(e){
						deferred.notify('更新失败');
					};
					var store = transaction.objectStore(objectStoreName);
					if(angular.isArray(data)){
						for(var i in data){
							var req = store.put(data[i]);
							req.onsuccess = function(){
								deferred.notify('success');
							};
						}
					}else{
						//插入数据
						var req = store.put(data);
						req.onsuccess = function(){
							deferred.resolve('success');
						};
						req.onerror = function(){
							deferred.reject('更新数据失败');
						}
					}
				},function(err){
					//打开数据库失败
					deferred.reject(err);
				});
			}else{
				//传入参数不存在
				deferred.reject('参数不全');
			}
			return deferred.promise;
		};
		/**
		 * 删除数据
		 * @param objectStoreName 表名
		 * @param key 主键
		 * @returns {Function|promise}
		 */
		service.remove = function(objectStoreName, key){
			var deferred = $q.defer();
			if(objectStoreName && key) {
				//检查db是否打开
				service.getDB().then(function(db){
					//打开数据仓库
					var transaction = db.transaction(objectStoreName,'readwrite');
					var store = transaction.objectStore(objectStoreName);
					var req = store.delete(key);
					req.onsuccess = function(){
						deferred.resolve('success');
					};
					req.onerror = function(){
						deferred.reject('删除数据失败');
					}
				},function(err){
					//打开数据库失败
					deferred.reject(err);
				});
			}else{
				//传入参数不存在
				deferred.reject('参数不全');
			}
			return deferred.promise;
		};
		/**
		 * 清空数据
		 * @param objectStoreName
		 * @returns {promise}
		 */
		service.clear = function(objectStoreName){
			var defer = $q.defer();
			if(objectStoreName){
				service.getDB().then(function(db){
					var transaction = db.transaction(objectStoreName,'readwrite');
					var store = transaction.objectStore(objectStoreName);
					var req = store.clear();
					req.onsuccess = function(){
						defer.resolve('success');
					}
				},function(err){
					defer.reject(err);
				});
			}else{
				defer.reject('参数不全');
			}
			return defer.promise;
		};
		/**
		 * 读取所有数据
		 * @param objectStoreName
		 * @returns {promise}
		 */
		service.loadAll = function(objectStoreName){
			var defer = $q.defer();
			var list = [];
			service.getDB().then(function(db){
				var transaction = db.transaction(objectStoreName);
				var store = transaction.objectStore(objectStoreName);
				store.openCursor().onsuccess = function(e) {
					var cursor = e.target.result;
					if(cursor) {
						list.push(cursor.value);
						cursor.continue();
					}else {
						defer.resolve(list);
					}
				};
			});
			return defer.promise;
		};
		/**
		 * 范围索引查询
		 * @param objectStoreName
		 * @param iName
		 * @param bLeft
		 * @param bRight
		 * @returns {promise}
		 */
		service.loadByIndexRange = function(objectStoreName,iName,bLeft,bRight){
			var defer = $q.defer();
			if(objectStoreName && iName){
				service.getDB().then(function(db){
					var list = [];
					var transaction = db.transaction(objectStoreName);
					var store = transaction.objectStore(objectStoreName);
					var boundKeyRange = IDBKeyRange.bound(bLeft, bRight);
					store.index(iName).openCursor(boundKeyRange).onsuccess = function(e){
						var cursor = e.target.result;
              if(cursor) {
                  list.push(cursor.value);
                  cursor.continue();
              }else {
                  defer.resolve(list);
              }
					}
				},function(err){
					defer.reject(err);
				});
			}else{
				defer.reject('参数不全');
			}
			return defer.promise;
		};
		return service;
	}]);
