/**
 * 会议室控制器
 */
'use strict';

angular.module('qnsofterApp')
	.controller('MeetingCtrl',function($scope,$rootScope,$log,MeetingService,SettingService){
		var vm = $scope.vm = {};
		vm.MeetingRoomList = [];
		vm.DepartmentList = [];
		vm.MeetingForm = {};
		vm.Account = {};
		vm.Habit = {};
		var CaptchaModal = $('#captchaModal');
		var MeetingModal = $('#meetingModal');
		//参数初始化
		$rootScope.getConfig(['HYSDMS_ACCOUNT','MEETING_HABIT']).then(function (items) {
			vm.Account = items['HYSDMS_ACCOUNT'] || {};
			vm.Habit = items['MEETING_HABIT'];
		});

		/**
		 * 获取部门信息
		 */
		MeetingService.getDepartmentList().then(function (list) {
			vm.DepartmentList = list;
		});

		/**
		 * 打开验证码控件
		 */
		vm.fnOpen = function(){
			if(!vm.Account.username || !vm.Account.password){
				$rootScope.notify('请先登陆');
				return;
			}
			var username = vm.Account.username;
			var password = vm.Account.password;
			vm.formData = {
				username: username,
				password: password
			};
			CaptchaModal.modal('show');
		};

		/**
		 * 读取记录前置事件
		 * @param captcha
		 * @param event
		 */
		vm.fnBeforeLoad = function(captcha,event){
			if(captcha){
				vm.formData.jcaptcha = captcha;
				$(event.target).button('loading');
				$rootScope.loading = true;
				SettingService.hysdmsLogin(vm.formData).then(function(){
					$(event.target).button('reset');
					$rootScope.loading = false;
					CaptchaModal.modal('hide');
					vm.fnLoadRecord(10);
				},function(err){
					$(event.target).button('reset');
					$rootScope.loading = false;
					$rootScope.notify(err);
				});
			}else{
				$rootScope.notify('请输入验证码');
			}
		};

		/**
		 * 读取会议室记录
		 * @param size
		 */
		vm.fnLoadRecord = function(size){
//			var today = '';
			var today = moment().format('YYYY-MM-DD');
			var event = arguments[1] || null;
			if(event){
				$(event.target).button('loading');
			}
			$rootScope.loading = true;
			MeetingService.query(today,size).then(function (res) {
				if(event){
					$(event.target).button('reset');
				}
				$rootScope.loading = false;
				$log.debug('返回数据%O', res);
				vm.MeetingRoomList = res.meetingroomList;
				var list = res.pageAbleInfo.records;
				var now = moment();
				angular.forEach(list,function(obj){
					var begin = moment(obj.startTime,'HH:mm');
					var end = moment(obj.endTime,'HH:mm');
					if(begin.isAfter(now)){
						//未开始
						obj.status = 1;
					}else if(end.isAfter(now)){
						//未结束
						obj.status = 2;
					}else{
						//已结束
						obj.status = 3;
					}
				});
				vm.MeetingList = list;
			},function(error){
				if(error == '网络异常'){
					$rootScope.notify(error);
					return;
				}
				if(event){
					$(event.target).button('reset');
				}
				$rootScope.loading = false;
				vm.fnOpen();
			});
		};

		/**
		 * 打开会议室预定界面
		 */
		vm.fnOpenMeetingModal = function(){
			//选择偏好设置
			if(vm.Habit){
				vm.MeetingForm['orderRecord.department.id'] = vm.Habit['orderRecord.department.id'];
				vm.MeetingForm['orderRecord.meetingroom.id'] = vm.Habit['orderRecord.meetingroom.id'];
			}
			MeetingModal.modal('show');
			vm.MeetingForm['orderRecord.startTime'] = moment().add('minutes',30).format('HH:mm');
			vm.MeetingForm['orderRecord.endTime'] = moment().add('minutes',90).format('HH:mm');
		};

		/**
		 * 预定会议室
		 * @param form
		 */
		vm.fnOrderingMeeting = function(form){
			$log.debug('提交的表单内容：%O', form);
			var now = moment();
			form.currentDate = now.format('YYYY-MM-DD');
			form['orderRecord.orderDate'] = now.format('YYYY-MM-DD');
			form.currentTime = now.format('HH:mm');
			if(!form['orderRecord.department.id']){
				$rootScope.notify('请选择部门');
				return;
			}
			if(!form['orderRecord.meetingroom.id']){
				$rootScope.notify('请选择会议室');
				return;
			}
			if(!form['orderRecord.startTime'] || now.isAfter(moment(form['orderRecord.startTime'],'HH:mm'))){
				$rootScope.notify('开始时间必须大于当前时间');
				return;
			}
			if(!form['orderRecord.endTime'] || moment(form['orderRecord.startTime'],'HH:mm').isAfter(moment(form['orderRecord.endTime'],'HH:mm'))){
				$rootScope.notify('结束时间必须大于开始时间');
				return;
			}
			$rootScope.loading = true;
			MeetingService.ordering(form).then(function(res){
				$rootScope.loading = false;
				$log.debug('预定成功');
				vm.fnLoadRecord(10);
				$rootScope.notify('预定成功！','success');
				MeetingModal.modal('hide');
				vm.fnHabitAction(form);
			},function(err){
				$rootScope.loading = false;
				$log.debug('预定失败%O', err);
				vm.fnLoadRecord(10);
				$rootScope.notify(err);
			});
		};

		/**
		 * 选择偏好保存
		 * @param form
		 */
		vm.fnHabitAction = function (form) {
			if(vm.Habit && vm.Habit['orderRecord.department.id'] == form['orderRecord.department.id']
				&& vm.Habit['orderRecord.meetingroom.id'] == form['orderRecord.meetingroom.id']){
				return;
			}
			Messenger().post({
				message: '是否记住你的选择偏好?',
				actions: {
					save: {
						label: '是',
						action: function (e, msg) {
							$rootScope.setConfig('MEETING_HABIT',{
								'orderRecord.department.id':form['orderRecord.department.id'],
								'orderRecord.meetingroom.id':form['orderRecord.meetingroom.id']
							}).then(function () {
								msg.hide();
								$rootScope.notify('设置成功!','success');
							});
						}
					},
					cancel: {	label: '否',action: function () {this.hide();}
					}
				}
			});
		}

	});
