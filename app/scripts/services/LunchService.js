/**
 * 订餐服务
 */
'use strict';

angular.module('qnsofterApp')
	.service('LunchService', function($q,$http,IndexedDB){
		var URL_HYSDMS_LUNCH = 'http://220.178.7.254:8081/hysdms/order/query.action';
		var URL_HYSDMS_ORDER = 'http://220.178.7.254:8081/hysdms/order/userOrder.action';
		/**
		 * 读取订餐记录(远程)
		 * @param num
		 * @returns {promise}
		 */
		this.load = function(num){
			var defer = $q.defer();
			var param = {
				'formType': 2,
				'orderRecordInfo.costBelong': 1,
				'orderRecordInfo.orderType': 1,
				'pageAbleInfo.startIndex': 0,
				'pageAbleInfo.pageSize': num,
				'pageAbleInfo.dir': 'asc',
				'timeStamp': Date.now()
			};
			var req = $http.post(URL_HYSDMS_LUNCH,param);
			req.success(function(res){
				if(angular.isObject(res)){
					defer.resolve(res.pageAbleInfo);
				}else{
					defer.reject('请重新登录');
				}
			});
			return defer.promise;
		};

		/**
		 * 订餐
		 * @param date 订餐时间
		 * @returns {promise}
		 */
		this.order = function(date){
			var defer = $q.defer();
			var formData = {
        inputNum: '1',
				inputCostBelong: '1',
				inputOrderDes: ''
			};
			var req = $http.post(URL_HYSDMS_ORDER,formData,{
				params: {
					'orderRecordInfo.orderDate': date
				}
			});
			req.success(function(res){
				var isSuccess = false;
				var msg;
				var result = /var stats = ".+";/.exec(res)[0].slice(13,-2);
				switch (result){
					case '1':
						isSuccess = true;
						msg = '订餐成功！';
						break;
					case '-1':
						msg = '订餐失败，请联系管理员。';
						break;
					case '-4':
						msg = '你今天已经订过餐了！^_^';
						break;
					case '-5':
						msg = '订餐时间已过，下次请提早喔~';
						break;
				};
				if(isSuccess){
					defer.resolve(msg);
				}else{
					defer.reject(msg);
				}
			});
      return defer.promise;
		};

		/**
		 * 查询本地订餐记录
		 */
		this.query = function(){
			var defer = $q.defer();
			IndexedDB.loadAll(IndexedDB.STORE_LUNCH).then(function (lunchList) {
				defer.resolve(lunchList);
			});
			return defer.promise;
		};

		/**
		 * 缓存数据
		 * @param data
		 * @returns {promise}
		 */
		this.save = function (data) {
			var defer = $q.defer();
			IndexedDB.insert(IndexedDB.STORE_LUNCH,data).then(function (res) {
				defer.resolve(res);
			}, function (error) {
				defer.reject(error);
			});
			return defer.promise;
		}
	});

