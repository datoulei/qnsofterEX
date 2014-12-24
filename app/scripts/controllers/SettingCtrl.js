/**
 * 设置控制器
 */
'use strict';

angular.module('qnsofterApp')
	.controller('SettingCtrl',function($scope,$rootScope,$log,SettingService,AttendanceService,RestaurantService, AvosService, AvosRESTApi){
		var CaptchaModal = $('#captchaModal');
		var vm = $scope.vm = {};
		vm.timestamp = Date.now();
		vm.Restaurant = {};
		vm.phoneSetting = {};
		vm.settingObj = new (AV.Object.extend('Setting'))();
		vm.fnInit = function(){
			//工具提示初始化
			$('i[data-toggle="tooltip"]').tooltip();
			/**
			 * 获取系统参数
			 */
			$rootScope.getConfig().then(function(items){
				$log.log(items);
				vm.Restaurant.version = items['RESTAURANT_VERSION'];
				if(items['HYSDMS_ACCOUNT']){
					vm.hysUsername = items['HYSDMS_ACCOUNT'].username;
					vm.hysPassword = items['HYSDMS_ACCOUNT'].password;
					vm.hysIsLogin = true;
				}
				vm.hysLunchNotify = items['HYSDMS_LUNCH_NOTIFY'] || {enable:false,time:'10:00'};
				if(items['ATTENDANCE_ACCOUNT']){
					vm.attendanceUsername = items['ATTENDANCE_ACCOUNT'].username;
					vm.attendancePassword = items['ATTENDANCE_ACCOUNT'].password;
					vm.attendanceIsLogin = true;
				}
				if(items['ATTENDANCE_WORK_ON']){
					vm.attendanceWorkOn = true;
				}
			});

			AvosService.getCurrentUser().then(function(user){
				vm.currentUser = user;
				vm.installationId = user.get('installationId');
				if(vm.installationId){
					vm.phoneSetting.enable = true;
				};
				console.log('用户:',user);
				if(vm.currentUser.get('setting')){
					vm.currentUser.get('setting').fetch().then(function(setting){
						$scope.$apply(function(){
							vm.settingObj = setting;
							vm.phoneSetting.workOn = setting.get('workOn');
							vm.phoneSetting.workOff = setting.get('workOff');
							vm.currentUser.set('setting', vm.settingObj);
						});
					});
				}else{
					vm.currentUser.set('setting', vm.settingObj);
				}
			});
		};
		/**
		 * 订餐提醒
		 * @param  {[type]} newvalue [description]
		 * @param  {[type]} oldvalue [description]
		 * @return {[type]}          [description]
		 */
		$scope.$watch('vm.hysLunchNotify',function (newvalue, oldvalue) {
			$log.debug('newvalue: %O',newvalue);
			$rootScope.setConfig('HYSDMS_LUNCH_NOTIFY',newvalue);
			SettingService.updateLunchNotify(newvalue);
		},true);

		/**
		 * 指纹考勤系统登录
		 * @param username
		 * @param password
		 */
		vm.fnAttendanceLogin = function (username, password, event) {
			var btn = $(event.target);
			btn.button('loading');
			$rootScope.loading = true;
			if(username && password) {
				AttendanceService.login(username,password).then(function () {
					$rootScope.setConfig('ATTENDANCE_ACCOUNT',{username:username,password:password}).then(function () {
						AttendanceService.getUserInfo().then(function (res) {
							btn.button('reset');
							$rootScope.loading = false;
							$rootScope.setConfig('ATTENDANCE_USER',res.data).then(function () {
								vm.attendanceIsLogin = true;
							});
						}, $rootScope.notify);
					});
				}, function(error){
					$rootScope.notify(error);
					$rootScope.loading = false;
					btn.button('reset');
				});
			} else {
				$rootScope.notify('请输入用户名密码');
			}
		};

		/**
		 * 指纹考勤系统注销
		 */
		vm.fnAttendanceLogout = function () {
			var msg = Messenger().post({
				message: '注销指纹考勤系统?',
				id: 'attendance',
				type: 'error',
				actions: {
					sure: {
						label: '确定',
						action: function() {
							$rootScope.setConfig(['ATTENDANCE_ACCOUNT','ATTENDANCE_USER']).then(function(){
								vm.attendanceUsername = '';
								vm.attendancePassword = '';
								vm.attendanceIsLogin = false;
								msg.update({
									message: '注销成功',
									type: 'success',
									hideAfter: 1,
									actions: false
								});
							},$rootScope.notify);
						}
					},
					cancel: {
						label: '取消',
						action: function(){
							return msg.hide();
						}
					}
				}
			});

		};

		/**
		 * 切换上班提醒状态
		 */
		vm.fnToggleWorkOn = function () {
			$rootScope.setConfig('ATTENDANCE_WORK_ON',!vm.attendanceWorkOn).then(function () {
				$rootScope.notify('设置成功!', 'success');
				vm.attendanceWorkOn = !vm.attendanceWorkOn;
			}, function () {
				$rootScope.notify('设置失败!');
			})
		};

		/**
		 * 更新外卖数据
		 * @param event
		 */
		vm.fnUpdateRestaurant = function(event){
			var btn = $(event.target);
			btn.button('loading');
			$rootScope.loading = true;
			SettingService.updateRestaurant().then(function(data){
				$log.log('下载外卖数据成功！数据：%o',data);
				//处理数据
				RestaurantService.save(data.restaurant).then(function () {
					$rootScope.setConfig('RESTAURANT_VERSION',data.version).then(function(){
						vm.Restaurant.version = data.version;
						$rootScope.loading = false;
						btn.button('reset');
						$rootScope.notify('下载外卖数据成功！','success');
					});
				});
			},function(){
				$log.log('下载外卖数据失败！');
				$rootScope.loading = false;
				btn.button('reset');
			});
		};

		/**
		 * 安徽青牛信息管理系统登录前置方法
		 * @param username
		 * @param password
		 */
		vm.fnHYSDMSBeforeLogin = function(username,password){
			if(username && password){
				CaptchaModal.modal('show');
			}else{
				$rootScope.notify('请输入账号和密码');
			}
		};

		/**
		 * 安徽青牛信息管理系统登录
		 * @param captcha 验证码
		 * @param username 用户名
		 * @param password 密码
		 */
		vm.fnHYSDMSLogin = function(captcha,event){
			var btn = $(event.target);
			var reqParam = {
				username: vm.hysUsername,
				password: vm.hysPassword,
				jcaptcha: captcha
			};
			btn.button('loading');
			$rootScope.loading = true;
			SettingService.hysdmsLogin(reqParam).then(function(){
				btn.button('reset');
				$rootScope.loading = false;
				CaptchaModal.modal('hide');
				var HysdmsAccount = {
					username: vm.hysUsername,
					password: vm.hysPassword
				};
				$rootScope.setConfig('HYSDMS_ACCOUNT',HysdmsAccount).then(function(){
					vm.hysIsLogin = true;
					$rootScope.notify('登录成功！','success');
				});
			},function(error){
				$rootScope.loading = false;
				btn.button('reset');
				$rootScope.notify(error);
			});
		};

		/**
		 * 安徽青牛信息管理系统注销登录
		 */
		vm.fnHYSDMSLogout = function(){
			var msg = Messenger().post({
				message: '注销安徽青牛信息管理系统?',
				id: 'hysdms',
				type: 'error',
				actions: {
					sure: {
						label: '确定',
						action: function() {
							$rootScope.setConfig('HYSDMS_ACCOUNT').then(function(){
								vm.hysUsername = '';
								vm.hysPassword = '';
								vm.hysIsLogin = false;
								msg.update({
									message: '注销成功',
									type: 'success',
									hideAfter: 1,
									actions: false
								});
							},$rootScope.notify);
						}
					},
					cancel: {
						label: '取消',
						action: function(){
							return msg.hide();
						}
					}
				}
			});
		};

		vm.fnSetPhoneAlert = function(type) {
			var pushData = {
				where: {
					installationId: vm.installationId
				}
			};
			switch (type){
				case 'workOn':
					vm.settingObj.set('workOn',vm.phoneSetting.workOn);
					pushData.data = {
						time: vm.phoneSetting.workOn,
						action: 'org.qnsofter.UPDATE_WORK_ON_ALERT_TIME'
					};
					break;
				case 'workOff':
					vm.settingObj.set('workOff',vm.phoneSetting.workOff);
					pushData.data = {
						time: vm.phoneSetting.workOff,
						action: 'org.qnsofter.UPDATE_WORK_OFF_ALERT_TIME'
					};
					break;
			}
			AvosRESTApi.push(pushData).then(function (argument) {
				$log.debug('推送成功!','success');
			}, function (error) {
				$log.debug('推送消息失败,错误代码:',error.code);
			});
			AvosService.updateUser({setting: vm.settingObj}).then(function(user){
				$rootScope.notify('设置成功!', 'success');
			}, function(error){
				$rootScope.notify('设置失败');
			});
		}
	});


