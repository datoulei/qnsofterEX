'use strict';

/* LocalStorage 类*/
var LocalStorage = (function(){
	var store = {};
	store.getItem = function (key) {
		var promise = new Promise(function (resolve) {
			chrome.storage.local.get(key || null,function(items){
				console.debug('exec LocalStorage.getItem, input=%O,output=%O', key, items);
				resolve(items);
			});
		});
		return promise;
	};
	store.setItem = function (data) {
		var promise = new Promise(function (resolve) {
			chrome.storage.local.set(data,function(items){
				console.debug('exec LocalStorage.setItem, data=%O', data);
				resolve(items);
			});
		});
		return promise;
	};
	store.removeItem = function (key) {
		var promise = new Promise(function (resolve, reject) {
			if(key){
				chrome.storage.local.remove(key,function(){
					console.debug('exec LocalStorage.removeItem, input=%O', key);
					resolve('删除成功!');
				});
			}else{
				reject('key不能为空');
			}
		});
		return promise;
	};
	return store;
})();
/* IndexedDB 类*/
var IndexedDB = (function () {
	var service = {
		DB_NAME: 'DataBase',
		DB_VERSION: 2,
		STORE_WORK: 'workRecords',
		STORE_RESTAURANTS: 'restaurants',
		STORE_OA_MESSAGES: 'oaMessages',
		STORE_LUNCH: 'lunchRecords'
	};
	/**
	 * 获得DB对象
	 * @returns {Promise}
	 */
	service.getDB = function () {
		var promise = new Promise(function (resolve, reject) {
			if(service.db){
				resolve(service.db);
			}else{
				//打开DB
				var request = indexedDB.open(service.DB_NAME,service.DB_VERSION);
				request.onerror = function(e) {
					//打开失败
					console.log('打开数据库异常:'+ e.target.errorCode);
					reject('打开数据库异常:' + e.target.errorCode);
				};
				request.onsuccess = function(e) {
					//打开成功
					console.log('打开数据库成功');
					service.db = e.target.result;
					resolve(service.db);
				};
				request.onupgradeneeded = function(e) {
					var db = e.target.result;
					if(db.objectStoreNames.contains('records')) {
						db.deleteObjectStore('records');
					}
					if(db.objectStoreNames.contains('restaurants')) {
						db.deleteObjectStore('restaurants');
					}
					if(db.objectStoreNames.contains('messages')) {
						db.deleteObjectStore('messages');
					}
					service.createObjectStore(db);
				};
			}
		});
		return promise;
	};
	/**
	 * 创建表结构
	 * @param db
	 */
	service.createObjectStore = function(db){
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
	};
	/**
	 * 插入数据
	 * @param objectStoreName 表名
	 * @param data 待插入数据
	 * @returns {Function|promise}
	 */
	service.insert = function(objectStoreName,data){
		var promise = new Promise(function (resolve, reject) {
			if(objectStoreName && data){
				//检查db是否打开
				service.getDB().then(function(db){
					//打开数据仓库
					var transaction = db.transaction(objectStoreName,'readwrite');
					var store = transaction.objectStore(objectStoreName);
					if(typeof data == 'object' && data.constructor == Array){
						var count = 0;
						transaction.oncomplete  = function(){
							console.log('更新完成，成功条数：%s',count);
							resolve({msg:'更新完成',count:count});
						};
						transaction.onerror = function(e){
							console.debug('插入操作失败%O',e);
							e.preventDefault();
						};
						for(var i in data){
							var req = store.add(data[i]);
							req.onsuccess = function(){
								count++;
								console.debug('插入数据成功！数据：%O', data[i]);
							};
						}
					}else{
						//插入数据
						var req = store.add(data);
						req.onsuccess = function(){
							resolve('插入数据成功！');
						}
						req.onerror = function(){
							reject('插入数据失败');
						}
					}
				},function(err){
					//打开数据库失败
					reject(err);
				});
			}else{
				//传入参数不存在
				reject('参数不全');
			}
		});
		return promise;
	};

	/**
	 * 更新数据
	 * @param objectStoreName 表名
	 * @param data 待更新数据
	 * @returns {Function|promise}
	 */
	service.update = function(objectStoreName,data){
		var promise = new Promise(function (resolve, reject) {
			if(objectStoreName && data){
				//检查db是否打开
				service.getDB().then(function(db){
					//打开数据仓库
					var transaction = db.transaction(objectStoreName,'readwrite');
					transaction.oncomplete  = function(){
						resolve('更新完成');
					};
					transaction.onerror = function(e){
						reject('更新失败');
					};
					var store = transaction.objectStore(objectStoreName);
					if(typeof data == 'object' && data.constructor == Array){
						for(var i in data){
							var req = store.put(data[i]);
							req.onsuccess = function(){
								console.debug('success');
							};
						}
					}else{
						//插入数据
						var req = store.put(data);
						req.onsuccess = function(){
							resolve('success');
						};
						req.onerror = function(){
							reject('更新数据失败');
						}
					}
				},function(err){
					//打开数据库失败
					reject(err);
				});
			}else{
				//传入参数不存在
				reject('参数不全');
			};
		});
		return promise;
	};

	service.clear = function(objectStoreName){
		var promise = new Promise(function(resolve, reject){
			if(objectStoreName){
				service.getDB().then(function(db){
					var transaction = db.transaction(objectStoreName,'readwrite');
					var store = transaction.objectStore(objectStoreName);
					var req = store.clear();
					req.onsuccess = function(){
						resolve('success');
					}
				},function(err){
					reject(err);
				});
			}else{
				reject('参数不全');
			}
		});
		return promise;
	}

	return service;
})();
/* Http 类 */
var Http = (function(){
	var http = {};
	http.get = function (url) {
		console.debug('exec Http.get, url=%O', url);
		console.time('GET请求耗时:');
		var promise = new Promise(function (resolve, reject) {
			function handler() {
				console.timeEnd('GET请求耗时:');
				if (this.readyState === this.DONE) {
					if (this.status === 200) {
						resolve(this.response);
					} else {
						reject(this);
					}
				}
			}
			var client = new XMLHttpRequest();
			client.open('GET', url);
			client.onreadystatechange = handler;
			client.send();

		});
		return promise;
	};
	http.post = function (url, data) {
		console.time('POST请求耗时:');
		var formData = new FormData();
		if(data instanceof FormData) {
			formData = data;
		}else if(typeof data == 'object'){
			for(var i in data){
				formData.append(i, data[i]);
			}
		}
		console.debug('exec Http.post, url=%O, data=%O', url, data);
		var promise = new Promise(function (resolve, reject) {
			function handler() {
				console.timeEnd('POST请求耗时:');
				if (this.readyState === this.DONE) {
					if (this.status === 200) {
						resolve(this.response);
					} else {
						reject(this);
					}
				}
			}

			var client = new XMLHttpRequest();
			client.open('POST', url, true);
			client.setRequestHeader('Accept', 'application/json, text/plain, */*');
			client.onreadystatechange = handler;
			client.send(formData);

		});
		return promise;
	};
	return http;
})();
/* Notify 类*/
var Notify = (function () {
	var notify = {};
	notify.create = function(opt) {
		var options = {
			type: 'basic',
			iconUrl: 'images/notify.jpg',
			title: '青牛助手',
			message: ''
		};
		if(typeof (opt) == 'string'){
			//字符串
			options.message = opt;
		}else if(typeof (opt) == 'object') {
			options = _.extend(options,opt);
		}else {
			return;
		}
		chrome.notifications.create('',options,function(id){
			console.debug('通知已创建%s', id);
		});
	};
	return notify;
})();
/* Attendance 类*/
var Attendance = (function () {
	var attendance = {};
	/**
	 * 设置基础URL
	 * @param url
	 * @returns {Promise}
	 */
	attendance.setBaseUrl = function (url) {
		var promise = new Promise(function (resolve) {
			attendance.URL_ATTENDANCE_LOGIN = url + '/iclock/accounts/login/';
			attendance.URL_ATTENDANCE_HOME = url + '/iclock/staff/';
			attendance.URL_ATTENDANCE_DATA = url + '/iclock/staff/transaction/';
			resolve();
		});
		return promise;
	};
	attendance.login = function (username,password) {
		var promise = new Promise(function (resolve, reject) {
			var param = {
				username: username,
				password: password,
				this_is_the_login_panel: 1
			};
			Http.post(attendance.URL_ATTENDANCE_LOGIN,param).then(function (res) {
				if(res.indexOf('result=2') > -1) {
					console.debug('登录成功！');
					resolve('登录成功！');
				}else {
					console.debug('登录失败!账号或密码错误');
					reject('登录失败!账号或密码错误');
				}
			}, function (error) {
				console.debug('请求失败!错误:',error);
			})
		});
		return promise;
	};
	attendance.getUserInfo = function () {
		var promise = new Promise(function (resolve, reject) {
			Http.get(attendance.URL_ATTENDANCE_HOME).then(function (res) {
				var uidText = /uid\=\"\d+\"\;/.exec(res)[0];
				var uid = uidText.slice(5,uidText.length-2);
				var staffText = /<strong>员工.\S*<\/strong>/.exec(res)[0];
				var staff = staffText.slice(11,staffText.length-9);
				if(uid && staff) {
					console.debug('获取用户成功！员工UID：%s,员工姓名：%s', uid, staff);
					var data = {
						uid: uid,
						name: staff
					};
					resolve({msg: '获取用户成功！', data: data});
				}else{
					console.debug('获取用户失败!请重新登录');
					reject('获取用户失败!请重新登录');
				}
			});
		});
		return promise;
	};
	attendance.queryAttendance = function (uid, from, to) {
		var promise = new Promise(function (resolve, reject) {
			var queryString = '?' + 'UserID__id__exact=' + uid + '&fromTime=' + from + '&toTime=' + to;
			Http.post(attendance.URL_ATTENDANCE_DATA + queryString).then(function (res) {
				console.debug('查询考勤数据成功!,返回值:', res);
				resolve(res);
			}, function (error) {
				console.debug('查询考勤数据失败!,错误:', error);
				reject('查询考勤数据失败!,错误:', error);
			})
		});
		return promise;
	};
	return attendance;
})();
/* Avos 类*/
var Avos = (function () {
	var avos = {};
	var appId = 'lcvvvd2zuh53pp72m53selvfedh3yh06mf2sth02g8unmafl';
	var appKey = 'm1f9i82dc24sqlg3r1xqspmi2rni88oyc57becaselcryv1n';
	var basePath = 'https://cn.avoscloud.com/1/classes/';
	avos.get = function (path, params) {
		var queryString = '';
		if(params && typeof params == 'object'){
			queryString = '?';
			for(var i in params){
				if(typeof params[i] == 'string' || typeof params[i] == 'number'){
					queryString += i + '=' + params[i] + '&';
				}else if(typeof params[i] == 'object'){
					queryString += i + '=' + JSON.stringify(params[i]) + '&';
				}
			}
			queryString = queryString.slice(0, -1);
		}
		var promise = new Promise(function (resolve, reject) {
			function handler() {
				console.timeEnd('GET请求耗时:');
				if (this.readyState === this.DONE) {
					if (this.status === 200) {
						resolve(JSON.parse(this.response));
					} else {
						reject(JSON.parse(this.response));
					}
				}
			}
			console.time('GET请求耗时:');
			var client = new XMLHttpRequest();
			client.open('GET', basePath + path + queryString);
			client.setRequestHeader('X-AVOSCloud-Application-Id', 'lcvvvd2zuh53pp72m53selvfedh3yh06mf2sth02g8unmafl');
			client.setRequestHeader('X-AVOSCloud-Application-Key', 'm1f9i82dc24sqlg3r1xqspmi2rni88oyc57becaselcryv1n');
			client.onreadystatechange = handler;
			client.send();
		});
		return promise;
	};
	return avos;
})();
/**
 * 初始化代码
 * @return {null}
 */
function run(){
	var now = new Date();
	var today = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();
	//转换为 YYYY-MM-DD格式
	today = today.replace(/\b(\w)\b/g, '0$1');
	LocalStorage.getItem().then(function (items) {
		//考勤账号
		var attendanceAccount = items['ATTENDANCE_ACCOUNT'] || {};
		// 最后一次打卡提醒日期
		var lastNotifyDate = items['ATTENDANCE_LAST_NOTIFY_DATE'];
		//是否开启打卡提醒
		var attendanceWorkOn = items['ATTENDANCE_WORK_ON'];

		var urlAttendance = 'http://219.142.74.35:49527';

		//判断是否符合提醒条件
		if(attendanceWorkOn && lastNotifyDate != today && attendanceAccount.username && attendanceAccount.password ){
			if(urlAttendance){
				Attendance.setBaseUrl(urlAttendance).then(function () {
					attendanceNotify(attendanceAccount);
				});
			}else{
				console.debug('系统参数缺少,无法查询考勤记录');
			}
		}else{
			console.debug('不符合提醒条件');
		}
	});
}

/**
 * 定时器监听任务
 * @param  {obj} alarm 定时器
 * @return {null}
 */
chrome.alarms.onAlarm.addListener(function (alarm){
	//定时器执行任务
	var name = alarm.name;
	console.log('定时器%o正在执行',alarm);
	switch (name) {
		case 'lunch_remind': //订餐提醒
			Notify.create('每天10:30截止订餐,不要忘记订餐喔!!!');
			break;
		case 'alive': //定时心跳
			run();
			break;
		case 'checkRestaurantData':
			checkRestaurantData();
			break;
	}
});

/**
 * 考勤通知
 * @param  {object} attendanceAccount 考勤网站登录账号
 * @return {null}
 */
function attendanceNotify(attendanceAccount){
	var now = new Date();
	var today = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();
	//转换为 YYYY-MM-DD格式
	today = today.replace(/\b(\w)\b/g, '0$1');
	//登录考勤网站
	Attendance.login(attendanceAccount.username, attendanceAccount.password).then(function () {
		//获取用户uid
		Attendance.getUserInfo().then(function (res) {
			//查询当天考勤
			Attendance.queryAttendance(res.data.uid,today,today).then(function (res) {
				var result = eval(res);
				if(result.length){
					//有打开记录
					Notify.create('今天上班已经打卡,好好开始一天的工作吧!');
				}else{
					//无打卡记录
					Notify.create('今天上班还未打卡,请抓紧时间打卡!');
				}
				LocalStorage.setItem({ATTENDANCE_LAST_NOTIFY_DATE:today});
			});
		});
	});
}

/**
 * 检查外卖数据是否有更新
 * @return {undefined}
 */
function checkRestaurantData() {
	LocalStorage.getItem('RESTAURANT_LAST_UPDATE_TIME').then(function (items) {
		var param = {
			enabled: true
		};
		if(items['RESTAURANT_LAST_UPDATE_TIME']){
			param.updatedAt = {
				'$gt': {
					'__type': 'Date',
					iso: new Date(items['RESTAURANT_LAST_UPDATE_TIME'])
				}
			}
			updateRestaurantData(param);
		}else{
			//先清除原有订餐数据
			IndexedDB.clear(IndexedDB.STORE_RESTAURANTS).then(function(){
				updateRestaurantData(param);
			});
		}

	});
}
function updateRestaurantData(param){
	Avos.get('Restaurant', {where: param}).then(function (res) {
		var dataArray = res.results;
		if(dataArray.length > 0) {
			IndexedDB.update(IndexedDB.STORE_RESTAURANTS, dataArray).then(function () {
				Notify.create('外卖数据有更新哦!');
				var date = new Date();
				//设置时差
				date.setMinutes(date.getMinutes() - (date.getTimezoneOffset()));
				LocalStorage.setItem({RESTAURANT_LAST_UPDATE_TIME: date.toJSON()}).then(function (e) {
					console.debug('已更新数据:', e);
				});
			});
		}else{
			console.debug('外卖数据无更新');
		}
	});
}

/**
 * 扩展插件安装或更新时触发事件
 * @param  {object} details 事件描述
 * @return {undefined}
 */
chrome.runtime.onInstalled.addListener(function (details) {
	console.log('previousVersion', details.previousVersion);
	//创建心跳定时器
	chrome.alarms.create('alive',{periodInMinutes: 10, when: Date.now()});
	//创建检查外卖数据定时器(间隔1天)
	chrome.alarms.create('checkRestaurantData',{periodInMinutes: 60*24, when: Date.now()});
});
console.debug('启动时间:'+(new Date()).toLocaleString());
