/**
 * 设置服务
 */
'use strict';

angular.module('qnsofterApp')
	.service('SettingService', function($q,$http,Chrome){
		var URL_RESTAURANT = 'http://qnsofter.qiniudn.com/restaurant.json'+'?timestamp='+Date.now();
		var URL_HYSDMS = 'http://220.178.7.254:8081/hysdms/system/loginAction!login.action';
		/**
		 * 下载外卖数据
		 * @returns {*}
		 */
		this.updateRestaurant = function(){
			var defer = $q.defer();
			var req = $http.get(URL_RESTAURANT);
			req.success(function(data){
				defer.resolve(data);
			});
			req.error(function(){
				defer.reject('下载外卖数据失败');
			});
			return defer.promise;
		};
		/**
		 * 安徽青牛信息系统登录
		 * @param data
		 * @returns {*}
		 */
		this.hysdmsLogin = function(data){
			var defer = $q.defer();
			var param = angular.copy(data);
			//密码加密
			var pwd = param.password.split('');
			pwd.forEach(function(char,index){
				char = char.charCodeAt(0);
				if(char >= 49 && char <= 57){
					char = pwd[index]*3+1;
				}
				pwd[index] = char;
			});
			param.password = pwd.toString();
			var req = $http.post(URL_HYSDMS,param);
			req.success(function(res){
				var error = /<.+error.+>/.exec(res);
				if(error){
					var errorText = error[0].replace(/<[^>]+>/g,'');
					defer.reject(errorText);
				}else{
					defer.resolve('success');
				}
			});
			req.error(function(){
				defer.reject('网络异常');
			});
			return defer.promise;
		};
		this.updateLunchNotify = function (obj) {
			var alarmName = 'lunch_remind';
			var alarmParam = {periodInMinutes: 24*60};
			var now = moment();
			var remind_time = moment(obj.time, 'HH:mm');
			if(obj.enable){
				//计算time
				if(remind_time.isBefore(now)){
					//从明天开始提醒
					remind_time.date(remind_time.date()+1);
				}
				alarmParam.when = remind_time.valueOf();
				Chrome.createAlarm(alarmName, alarmParam);
			}else{
				Chrome.clearAlarm(alarmName);
			}
		}
	});


