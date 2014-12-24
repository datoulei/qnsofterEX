/**
 * localStorage 服务
 */
'use strict';

angular.module('localStorage',[])
	.factory('LocalStorage',['$q',function($q){
		var service = {};
		/**
		 * 存储数据
		 * @param key
		 * @param value
		 * @returns {Function|promise}
		 */
		service.set = function(key,value) {
			var deferred = $q.defer();
			var data = {};
			if(angular.isString(key)){
				data[key] = value;
			}else if(angular.isObject(key)){
				data = key;
			}
			chrome.storage.local.set(data,function(){
				deferred.resolve(data);
			});
			return deferred.promise;
		};
		/**
		 * 读取数据
		 * @param key 键名
		 * @returns {Function|promise}
		 */
		service.get = function(key){
			var deferred = $q.defer();
			chrome.storage.local.get(key || null,function(items){
				deferred.resolve(items);
			});
			return deferred.promise;
		};
		/**
		 * 删除数据
		 * @param key 键名
		 * @returns {promise}
		 */
		service.remove = function(key){
			var deferred = $q.defer();
			if(key){
				chrome.storage.local.remove(key,function(){
					deferred.resolve('删除成功!');
				});
			}else{
				deferred.reject('key不能为空');
			}
			return deferred.promise;
		};
		/**
		 * 清除数据
		 * @returns {Function|promise}
		 */
		service.clear = function(){
			var deferred = $q.defer();
			chrome.storage.local.clear(function(){
				deferred.resolve('success');
			});
			return deferred.promise;
		};
		return service;
	}]);

