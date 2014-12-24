/**
 * Chrome模块
 */
'use strict';
angular.module('chrome',[])
	.factory('Chrome',function($q,$log){
		var service = {};
		/**
		 * 获取chrome后台页面对象
		 * @return {object} promise对象
		 */
		service.getBackgroundPage = function () {
			var defer = $q.defer();
			chrome.runtime.getBackgroundPage(function (page) {
				defer.resolve(page);
			});
			return defer.promise;
		};
		/**
		 * 创建定时器
		 * @param  {string} name 定时器名称
		 * @param  {object} info 定时器配置信息
		 * @return {object}      promise对象
		 */
		service.createAlarm = function (name, info) {
			var defer = $q.defer();
			try{
				chrome.alarms.create(name,info);
				$log.debug('创建定时器成功!名称:',name);
				defer.resolve('创建定时器成功!名称:',name);
			}catch(e){
				$log.error('创建定时器异常!错误:',e);
				defer.reject('创建定时器异常!错误:',e);
			}
			return defer.promise;
		};
		/**
		 * 清除定时器
		 * @param  {string} name 定时器名称
		 * @return {object}      promise对象
		 */
		service.clearAlarm = function (name) {
			var defer = $q.defer();
			try{
				chrome.alarms.clear(name,function (wasCleared) {
					if(wasCleared){
						$log.debug('清除定时器成功!名称:',name);
						defer.resolve('清除定时器成功!名称:',name);
					}else{
						$log.debug('清除定时器失败!名称:',name);
						defer.resolve('清除定时器失败!名称:',name);
					}
				});
			}catch(e){
				$log.error('清除定时器异常!错误:',e);
				defer.reject('清除定时器异常!错误:',e);
			}
			return defer.promise;
		};
		return service;
	});
