/**
 * 外卖服务
 */
'use strict';

angular.module('qnsofterApp')
	.service('RestaurantService', function($log,$q,IndexedDB){
		/**
		 * 读取外卖数据
		 * @returns {promise}
		 */
		this.load = function(){
			$log.debug('RestaurantService.load begin');
			var defer = $q.defer();
			IndexedDB.loadAll(IndexedDB.STORE_RESTAURANTS).then(function (restaurantList) {
				$log.debug('RestaurantService.load end');
				defer.resolve(restaurantList);
			}, function (error) {
				$log.debug('RestaurantService.load end');
				defer.reject(error);
			});
			return defer.promise;
		};

		/**
		 * 保存外卖信息到数据库
		 * @param data
		 */
		this.save = function (data) {
			$log.debug('RestaurantService.save begin');
			var defer = $q.defer();
			IndexedDB.insert(IndexedDB.STORE_RESTAURANTS,data).then(function (res) {
				$log.debug('RestaurantService.save end');
				defer.resolve(res);
			}, function (error) {
				$log.debug('RestaurantService.save end');
				defer.reject(error);
			});
			return defer.promise;
		};
	});

