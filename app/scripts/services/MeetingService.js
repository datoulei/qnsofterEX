/**
 * 会议室服务
 */
'use strict';

angular.module('qnsofterApp')
	.service('MeetingService', function($http,$q,$log){
		var URL_HYSDMS_METTING = 'http://220.178.7.254:8081/hysdms/orderRecord/query.action';
		var URL_HYSDMS_ORDERING = 'http://220.178.7.254:8081/hysdms/orderRecord/add.action';
		var departmentList = [
			{id:1,name:'系统用户'},
			{id:2,name:'管理办'},
			{id:3,name:'产品规划部'},
			{id:4,name:'质量管理部'},
			{id:5,name:'开发一部'},
			{id:6,name:'开发二部'},
			{id:7,name:'开发三部'},
			{id:8,name:'开发四部'},
			{id:9,name:'开发五部'},
			{id:10,name:'安徽办'},
			{id:11,name:'开发六部'}
		];
		/**
		 * 查询会议室预定记录
		 * @param date 日期 yyyy-mm-dd
		 * @returns {promise}
		 */
		this.query = function(date,size){
			var defer = $q.defer();
			var param = {
				'orderRecord.orderDate': date,
				'pageAbleInfo.startIndex': 0,
				'pageAbleInfo.pageSize': size,
				'pageAbleInfo.dir': 'asc',
				'timeStamp': Date.now()
			};
			var req = $http.post(URL_HYSDMS_METTING, param);
			req.success(function(res){
				if(angular.isObject(res)){
					defer.resolve(res);
				}else{
					defer.reject('请重新登录');
				}
			});
			return defer.promise;
		};

		/**
		 * 预定会议室
		 * @param form
		 * @returns {promise}
		 */
		this.ordering = function(form){
			var defer = $q.defer();
			var req = $http.post(URL_HYSDMS_ORDERING,form);
			req.success(function(res){
				var error = /<.+error.+>/.exec(res);
				if(error){
					var errorText = error[0].replace(/<[^>]+>/g,'');
					defer.reject(errorText);
				}else {
					defer.resolve('success');
				}
			});
			req.error(function(err){
				defer.reject(err);
			});
			return defer.promise;
		};

		this.getDepartmentList = function () {
			$log.debug('begin MeetingService.getDepartmentList');
			var defer = $q.defer();
			defer.resolve(departmentList);
			return defer.promise;
		};
	});
