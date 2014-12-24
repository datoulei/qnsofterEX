/**
 * 考勤服务
 */
'use strict';

angular.module('qnsofterApp')
	.service('AttendanceService',function($rootScope,$http,$q,IndexedDB){
		var URL_ATTENDANCE_LOGIN = 'http://219.142.74.35:49527/iclock/accounts/login/';
		var URL_ATTENDANCE_HOME = 'http://219.142.74.35:49527/iclock/staff/';
		var URL_ATTENDANCE_DATA = 'http://219.142.74.35:49527/iclock/staff/transaction/';
		/**
		 * 登录考勤系统
		 * @param username
		 * @param password
		 * @returns {promise}
		 */
		this.login = function(username,password){
			var defer = $q.defer();
			var param = {
				username: username,
				password: password,
				this_is_the_login_panel: 1
			};
			var req = $http.post(URL_ATTENDANCE_LOGIN, param);
			req.success(function (res)	{
				if(res.indexOf('result=2') > -1) {
					console.log('登录成功！正在获取用户资料');
					defer.resolve('登录成功！正在获取用户资料');
				}else {
					defer.reject('账号或密码错误');
				}
			});
			req.error(function (err,status) {
				console.log('请求失败，错误代码：%o', status);
				defer.reject('登录失败，请检查网络');
			});
			return defer.promise;
		};
		/**
		 * 获取用户信息
		 * @returns {promise}
		 */
		this.getUserInfo = function () {
			var defer = $q.defer();
			var req = $http.get(URL_ATTENDANCE_HOME);
			req.success(function (res) {
				var uidText = /uid\=\"\d+\"\;/.exec(res)[0];
				var uid = uidText.slice(5,uidText.length-2);
				var staffText = /<strong>员工.\S*<\/strong>/.exec(res)[0];
				var staff = staffText.slice(11,staffText.length-9);
				if(uid && staff) {
					console.log('获取用户成功！员工UID：%s,员工姓名：%s', uid, staff);
					var data = {
						uid: uid,
						name: staff
					};
					defer.resolve({msg: '获取用户成功！', data: data});
				}
			});
			req.error(function (err,status) {
				console.log('请求失败，错误代码：%o', status);
				defer.reject('登录失败，请检查网络');
			})
			return defer.promise;
		};
		/**
		 * 读取考勤数据
		 * @param uid 用户uid
		 * @param from 开始日期
		 * @param to 结束日期
		 * @returns {promise}
		 */
		this.load = function (uid,from,to) {
			var defer = $q.defer();
			var form = {
				UserID__id__exact: uid,
				fromTime: from,
				toTime: to
			};
			var req = $http.post(URL_ATTENDANCE_DATA,{},{	params:form});
			req.success(function (res) {
				if(angular.isObject(res)){
					//数据处理
					var result = {};
					console.time('考勤数据处理');
					angular.forEach(res, function (obj) {
						var oDate = moment(obj['TTime'], 'YYYY-MM-DD HH:mm:ss');
						var strDate = oDate.format('YYYY-MM-DD');
						if(!this.hasOwnProperty(strDate)){
							this[strDate] = {
								date: strDate,     //日期
								items: [],         //考勤记录数组
								isLate:true,      //是否迟到
								isLateLite:true,  //是否轻微迟到
								isEarly:true,     //是否早退
								isOutTime: false, //是否加班
								week: oDate.day()  //星期数
							};
						}
						this[strDate].items.push(obj['TTime']);
						//时间比较
						checkDate(this[strDate], oDate);
					},result);
					console.timeEnd('考勤数据处理');
					defer.resolve(result);
				}else{
					defer.reject('用户未登录');
				}
			});
			req.error(function () {
				defer.reject('网络异常');
			});
			return defer.promise;
		};
		/**
		 * 查询记录
		 * @param begin 开始区间
		 * @param end 结束区间
		 * @returns {promise}
		 */
		this.query = function(begin,end){
			var defer = $q.defer();
			IndexedDB.loadByIndexRange(IndexedDB.STORE_WORK,'data',begin,end).then(function (list) {
				defer.resolve(list);
			}, function (err) {
				defer.reject(err);
			});
			return defer.promise;
		};
		/**
		 * 保存记录
		 * @param data
		 * @returns {promise}
		 */
		this.save = function(data){
			var defer = $q.defer();
			IndexedDB.update(IndexedDB.STORE_WORK,data).then(function (res) {
				defer.resolve(res);
			}, function (err) {
				defer.reject(err);
			});
			return defer.promise;
		};

		/**
		 * 日期检查
		 * @param obj
		 * @param date
		 */
		function checkDate(obj,oDate){
			var check = angular.copy(oDate);
			if(obj.isLateLite && oDate.isBefore(check.hour(9).minute(0).second(1))){
				//9点前-未轻微迟到
				obj.isLateLite = false;
			}
			if(obj.isLate && oDate.isBefore(check.hour(9).minute(10).second(1))){
				//9点10分前-未迟到
				obj.isLate = false;
			}
			if(obj.isEarly && oDate.isAfter(check.hour(17).minute(59).second(59))){
				//18点后 - 未早退
				obj.isEarly = false;
			}
			if(oDate.isAfter(check.hour(20).minute(59).second(59))){
				//21点后 - 加班
				obj.isOutTime = true;
			}
			if(oDate.day() == 0 || oDate.day() == 6){
				//周末加班
				obj.isLateLite = false;
				obj.isLate = false;
				obj.isEarly = false;
				obj.isOutTime = true;
			}
		}
	});

