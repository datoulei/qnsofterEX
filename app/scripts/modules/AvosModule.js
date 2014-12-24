'use strict';
angular.module('avos', [])
	.value('appId', 'lcvvvd2zuh53pp72m53selvfedh3yh06mf2sth02g8unmafl')
	.value('appKey', 'm1f9i82dc24sqlg3r1xqspmi2rni88oyc57becaselcryv1n')
	.run(function(appId, appKey) {
		AV.initialize(appId, appKey);
		console.debug('初始化AVOS');
	})
	.factory('AvosService', function($q, $http, $rootScope, $log) {
		var service = {};
		var Feedback = AV.Object.extend('Feedback');
		var currentUser = AV.User.current();
		/**
		 * 添加意见反馈
		 * @param data 反馈数据
		 * @returns {*}
		 */
		service.addFeedback = function(data) {
			var defer = $q.defer();
			var fb = new Feedback();
			fb.save(data).then(function(obj) {
				$log.debug('添加反馈数据成功!,id:', obj.id);
				defer.resolve(obj.id);
			}, function(error) {
				$log.debug('添加反馈数据失败!错误信息:', error.description);
				defer.reject('添加反馈数据失败!');
			});
			return defer.promise;
		};

		/**
		 * 获取当前用户
		 * @return {[type]} [description]
		 */
		service.getCurrentUser = function(){
			var defer = $q.defer();
			if(currentUser){
				currentUser.fetch().then(function(user){
					currentUser = user;
					defer.resolve(currentUser);
				}, function(){
					defer.resolve(currentUser);
				});
			}else{
				defer.reject();
			}
			return defer.promise;
		};

		service.updateUser = function(obj){
			var defer = $q.defer();
			if(obj){
				for(var i in obj){
					currentUser.set(i, obj[i]);
				}
			}
			currentUser.fetchWhenSave(true);
			currentUser.save().then(function(user){
				currentUser = user;
				defer.resolve(user);
			}, defer.reject);
			return defer.promise;
		};

		/**
		 * 用户登录
		 * @param obj 账号信息
		 * @returns {*}
		 */
		service.login = function(username, password) {
			var defer = $q.defer();
			AV.User.logIn(username, password).then(function(user) {
				$log.debug('登录成功!');
				currentUser = AV.User.current();
				defer.resolve(user);
			}, function(error) {
				$log.debug('登录失败!错误代码:%s', error.code);
				defer.reject(error);
			});
			return defer.promise;
		};
		/**
		 * 用户注册
		 * @param obj
		 * @returns {*}
		 */
		service.register = function(obj) {
			var defer = $q.defer();
			var user = new AV.User();
			for (var i in obj) {
				user.set(i, obj[i]);
			}
			user.signUp(null).then(function(user) {
				$log.debug('注册成功!');
				defer.resolve(user);
			}, function(error) {
				$log.debug('注册失败!错误代码:%s', error.code);
				defer.reject(error);
			});
			return defer.promise;
		};

		return service;
	})
	.factory('AvosRESTApi', function($q, $http, $log, appId, appKey) {
		var service = {};

		/**
		 * 用户登录
		 * @param obj 账号信息
		 * @returns {*}
		 */
		service.login = function(obj) {
			var timestamp = Date.now();
			var sign = md5(timestamp + appKey);
			var defer = $q.defer();
			var req = $http({
				method: 'GET',
				url: 'https://cn.avoscloud.com/1/login',
				params: obj,
				headers: {
					'Content-Type': 'application/json',
					'X-AVOSCloud-Application-Id': appId,
					'X-AVOSCloud-Request-Sign': sign + ',' + timestamp
				}
			});
			req.success(function(res) {
				$log.debug('请求成功!,返回值:', res);
				defer.resolve(res);
			});
			req.error(function(error) {
				$log.debug('请求失败!错误码:', error);
				defer.reject(error);
			});
			return defer.promise;
		};
		/**
		 * 用户注册
		 * @param obj
		 * @returns {*}
		 */
		service.register = function(obj) {
			var timestamp = Date.now();
			var sign = md5(timestamp + appKey);
			var defer = $q.defer();
			var req = $http({
				method: 'POST',
				url: 'https://cn.avoscloud.com/1/users',
				data: obj,
				headers: {
					'Content-Type': 'application/json',
					'X-AVOSCloud-Application-Id': appId,
					'X-AVOSCloud-Request-Sign': sign + ',' + timestamp
				}
			});
			req.success(function(res) {
				$log.debug('请求成功!,返回值:', res);
				defer.resolve(res);
			});
			req.error(function(error) {
				$log.debug('请求失败!错误码:', error);
				defer.reject(error);
			});
			return defer.promise;
		};
		/**
		 * 获取用户列表
		 * @returns {*}
		 */
		service.users = function() {
			var timestamp = Date.now();
			var sign = md5(timestamp + appKey);
			var defer = $q.defer();
			var req = $http({
				method: 'GET',
				url: 'https://cn.avoscloud.com/1/users',
				headers: {
					'Content-Type': 'application/json',
					'X-AVOSCloud-Application-Id': appId,
					'X-AVOSCloud-Request-Sign': sign + ',' + timestamp
				}
			});
			req.success(function(res) {
				$log.debug('请求成功!,返回值:', res);
				defer.resolve(res);
			});
			req.error(function(error) {
				$log.debug('请求失败!错误码:', error);
				defer.reject(error);
			});
			return defer.promise;
		};

		/**
		 * 推送消息
		 * @param  {[type]} data [description]
		 * @return {[type]}      [description]
		 */
		service.push = function(data) {
			var defer = $q.defer();
			var timestamp = Date.now();
			var sign = md5(timestamp + appKey);
			var req = $http({
				method: 'POST',
				url: 'https://cn.avoscloud.com/1/push',
				data: data,
				headers: {
					'Content-Type': 'application/json',
					'X-AVOSCloud-Application-Id': appId,
					'X-AVOSCloud-Request-Sign': sign + ',' + timestamp
				}
			});
			req.success(function(res) {
				$log.debug('请求成功!,返回值:', res);
				defer.resolve(res);
			});
			req.error(function(error) {
				$log.debug('请求失败!错误码:', error);
				defer.reject(error);
			});
			return defer.promise;
		};

		/**
		 * 通用get请求
		 * @param  {string} path   请求路径
		 * @param  {object} params 请求参数
		 * @return {promise}
		 */
		service.get = function(path, params) {
			var timestamp = Date.now();
			var sign = md5(timestamp + appKey);
			var defer = $q.defer();
			var req = $http({
				method: 'GET',
				url: 'https://cn.avoscloud.com/1/classes/' + path,
				params: params,
				headers: {
					'Content-Type': 'application/json',
					'X-AVOSCloud-Application-Id': appId,
					'X-AVOSCloud-Request-Sign': sign + ',' + timestamp
				}
			});
			req.success(function(res) {
				$log.debug('请求成功!,返回值:', res);
				defer.resolve(res);
			});
			req.error(function(error) {
				$log.debug('请求失败!错误码:', error);
				defer.reject(error);
			});
			return defer.promise;
		};

		/**
		 * 通用post请求
		 * @param  {string} path 请求路径
		 * @param  {object} data 请求数据
		 * @return {[type]}      [description]
		 */
		service.post = function(path, data) {
			var timestamp = Date.now();
			var sign = md5(timestamp + appKey);
			var defer = $q.defer();
			var req = $http({
				method: 'POST',
				url: 'https://cn.avoscloud.com/1/classes/' + path,
				data: data,
				headers: {
					'Content-Type': 'application/json',
					'X-AVOSCloud-Application-Id': appId,
					'X-AVOSCloud-Request-Sign': sign + ',' + timestamp
				}
			});
			req.success(function(res) {
				$log.debug('请求成功!,返回值:', res);
				defer.resolve(res);
			});
			req.error(function(error) {
				$log.debug('请求失败!错误码:', error);
				defer.reject(error);
			});
			return defer.promise;
		};

		/**
		 * 通用PUT请求
		 * @param path
		 * @param data
		 * @returns {*}
		 */
		service.put = function(path, data) {
			var timestamp = Date.now();
			var sign = md5(timestamp + appKey);
			var defer = $q.defer();
			var req = $http({
				method: 'PUT',
				url: 'https://cn.avoscloud.com/1/classes/' + path,
				data: data,
				headers: {
					'Content-Type': 'application/json',
					'X-AVOSCloud-Application-Id': appId,
					'X-AVOSCloud-Request-Sign': sign + ',' + timestamp
				}
			});
			req.success(function(res) {
				$log.debug('请求成功!,返回值:', res);
				defer.resolve(res);
			});
			req.error(function(error) {
				$log.debug('请求失败!错误码:', error);
				defer.reject(error);
			});
			return defer.promise;
		};

		/**
		 * 通用delete请求
		 * @param path
		 * @returns {*}
		 */
		service.del = function(path) {
			var timestamp = Date.now();
			var sign = md5(timestamp + appKey);
			var defer = $q.defer();
			var req = $http({
				method: 'DELETE',
				url: 'https://cn.avoscloud.com/1/classes/' + path,
				headers: {
					'Content-Type': 'application/json',
					'X-AVOSCloud-Application-Id': appId,
					'X-AVOSCloud-Request-Sign': sign + ',' + timestamp
				}
			});
			req.success(function(res) {
				$log.debug('请求成功!,返回值:', res);
				defer.resolve(res);
			});
			req.error(function(error) {
				$log.debug('请求失败!错误码:', error);
				defer.reject(error);
			});
			return defer.promise;
		};
		return service;
	});