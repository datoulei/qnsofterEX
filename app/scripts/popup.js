'use strict';
angular.module('qnsofterApp', ['ngRoute','ngAnimate','localStorage','indexedDB','chrome','firebase','avos','monospaced.qrcode','angularFileUpload'])
	.config(function($provide,$routeProvider,$httpProvider,$compileProvider) {
		$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|chrome-extension):/);
		$compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|data|chrome-extension):/);
		//路由配置
		$routeProvider.when('/home', {templateUrl: 'views/HomeViewModel.html',controller: 'HomeCtrl'});
		$routeProvider.when('/attendance', {templateUrl: 'views/AttendanceViewModel.html',controller: 'AttendanceCtrl'});
		$routeProvider.when('/lunch', {templateUrl: 'views/LunchViewModel.html',controller: 'LunchCtrl'});
		$routeProvider.when('/meeting', {templateUrl: 'views/MeetingViewModel.html',controller: 'MeetingCtrl'});
		$routeProvider.when('/oa', {templateUrl: 'views/OfficeAutomationViewModel.html',controller: 'OfficeAutomationCtrl'});
		$routeProvider.when('/chat', {templateUrl: 'views/ChatViewModel.html',controller: 'ChatCtrl'});
		$routeProvider.when('/restaurant', {templateUrl: 'views/RestaurantViewModel.html',controller: 'RestaurantCtrl'});
		$routeProvider.when('/setting', {templateUrl: 'views/SettingViewModel.html',controller: 'SettingCtrl'});
		$routeProvider.when('/feedback', {templateUrl: 'views/FeedbackViewModel.html',controller: 'FeedbackCtrl'});
		$routeProvider.when('/about', {templateUrl: 'views/AboutViewModel.html'});
		$routeProvider.otherwise({redirectTo: '/home'});

		//http请求Content-type = application/json 改为 application/x-www-form-urlencoded
		$httpProvider.defaults.headers.post = {'Content-Type':'application/x-www-form-urlencoded'};
		$httpProvider.defaults.headers.get = {'Content-Type':'application/x-www-form-urlencoded'};
		$httpProvider.defaults.transformRequest = [function(data,headersGetter){
			if(headersGetter()['Content-Type'] === 'application/x-www-form-urlencoded'){
				return angular.isObject(data) && String(data) !== '[object File]' ? $.param(data) : data;
			}else{
				return angular.toJson(data);
			}
		}];
	})
	.constant('FIREBASE_DOMAIN','qnsofter');

angular.module('qnsofterApp')
	.run(function($rootScope,$q,$log,$filter,LocalStorage){
		/**
		 * 进度条状态
		 * @type {boolean}
		 */
		$rootScope.loading = false;
		/* 菜单 */
		$rootScope.MenuList = [
			{
				title: '考勤查询',
				icon: 'fa fa-lg fa-clock-o',
				link: '/attendance'
			},
			{
				title: '订餐管理',
				icon: 'fa fa-lg fa-cutlery',
				link: '/lunch'
			},
			{
				title: '会议室预约',
				icon: 'fa fa-lg fa-users',
				link: '/meeting'
			},
			{
				title: 'OA管理',
				icon: 'fa fa-lg fa-file-text',
				link: '/oa',
				status: false,
				hidden: true
			},
			{
				title: 'MantisBT',
				icon: 'fa fa-lg fa-bug',
				link: '/mantis',
				status: false
			},
			{
				title: '聊天室',
				icon: 'fa fa-lg fa-comments',
				link: '/chat',
				status: true
			},
			{
				title: '外卖点餐',
				icon: 'fa fa-lg fa-phone',
				link: '/restaurant'
			},
			{
				title: '系统设置',
				icon: 'fa fa-lg fa-cog',
				link: '/setting'
			},
			{
				title: '意见反馈',
				icon: 'fa fa-lg fa-support',
				link: '/feedback',
				status: true
			},
			{
				title: '关于我们',
				icon: 'fa fa-lg fa-info-circle',
				link: '/about'
			}
		];

		/**
		 * 路由跳转控制
		 */
		$rootScope.$on('$locationChangeStart',function(event,newUrl){
			var menus = event.targetScope.MenuList || null;
			var pathName = newUrl.slice(newUrl.lastIndexOf('/') + 1);
			var obj = $filter('filter')(menus,{link:pathName})[0];
			if(!obj){
				$rootScope.ModuleName = null;
			}	else if(obj.status === false){
				event.preventDefault();
				$rootScope.notify('该功能暂未开放');
			}
		});
		$rootScope.$on('$routeChangeSuccess',function(event,newRoute){
			if(newRoute.$$route){
				var menu = $filter('filter')($rootScope.MenuList,{link: newRoute.$$route.originalPath})[0];
				if(menu){
					$rootScope.ModuleName = menu.title;
				}
			}
		});
		/**
		 * 加载参数
		 * @returns {promise}
		 */
		$rootScope.loadConfig = function () {
			var defer = $q.defer();
			LocalStorage.get().then(function(items){
				//加载参数
				$log.debug('参数加载完毕:%O',items);
				$rootScope._config = items;
				defer.resolve(items);
			});
			return defer.promise;
		};
		/**
		 * 获取系统参数
		 * @returns {Function|promise}
		 */
		$rootScope.getConfig = function(key){
			var defer = $q.defer();
			var config = $rootScope._config;
			if(!config){
				//config不存在
				$rootScope.loadConfig().then(function () {
					defer.resolve($rootScope.getConfig(key));
				});
			}else{
				if(!key){
					defer.resolve(config);
				}	else if(angular.isString(key)){
					defer.resolve(config[key]);
				} else	if(angular.isArray(key)){
					defer.resolve(_.pick(config, key));
				}
			}
			return defer.promise;
		};

		/**
		 * 设置系统参数
		 * @param key
		 * @param value
		 * @returns {promise}
		 */
		$rootScope.setConfig = function (key,value) {
			var defer = $q.defer();
			var config = $rootScope._config;
			if(!config){
				//config不存在
				$rootScope.loadConfig().then(function () {
					defer.resolve($rootScope.setConfig(key,value));
				});
			}else{
				if(angular.isString(key)){
					if(!value){
						//删除属性
						LocalStorage.remove(key).then(function (res) {
							config[key] = undefined;
							defer.resolve(res);
						});
					}else{
						LocalStorage.set(key,value).then(function (res) {
							config[key] = value;
							defer.resolve(res);
						});
					}
				}else if(angular.isArray(key)){
					if(!value){
						angular.forEach(key, function (subKey) {
							LocalStorage.remove(subKey).then(function () {
								config[subKey] = undefined;
							});
						});
						defer.resolve();
					}
				}else if(angular.isObject(key)){
					LocalStorage.set(key).then(function (res) {
						angular.extend(config, key);
						defer.resolve(res);
					});
				}
			}
			return defer.promise;
		};

		$rootScope.notify = function(message,type){
			Messenger().post({
				id: 'qnsofter',
				message:message,
				type: type || 'error',
				hideAfter: 3
			});
		};

	});

/**
 * Messenger设置
 */
Messenger.options = {
	extraClasses: 'messenger-fixed messenger-on-top',
	theme: 'future',
	maxMessages: 3
};
