/**
 * 考勤控制器
 */
'use strict';

angular.module('qnsofterApp')
	.controller('AttendanceCtrl',function($scope,$log,$q,$rootScope,AttendanceService){
		var vm = $scope.vm = {};
		vm.today = vm.from = vm.to = moment().format('YYYY-MM-DD');
		var QueryModal = $('#queryModal');
		var RecordModal = $('#recordModal');
		$rootScope.getConfig(['ATTENDANCE_USER','ATTENDANCE_ACCOUNT']).then(function (items) {
			vm.User = items['ATTENDANCE_USER'] || {};
			vm.Account = items['ATTENDANCE_ACCOUNT'] || {};
		});
		/**
		 * 加载数据
		 */
		vm.fnLoadRecord = function (from,to) {
			//校验from是否大于to
			if(moment(from).isAfter(moment(to))){
				$rootScope.notify('开始日期不能大于结束日期');
				return;
			}
			if(vm.Account && vm.Account.username && vm.Account.password){
				//账号信息已保存
				if(vm.User && vm.User.uid) {
					var uid = vm.User.uid;
					$rootScope.notify('正在查询,请稍候...', 'info');
					$rootScope.loading = true;
					AttendanceService.load(uid, from, to).then(function (res) {
						$rootScope.loading = false;
						QueryModal.modal('hide');
						vm.RecordList = res;
						//将数据保存到IndexedDB
						AttendanceService.save(_.values(res));
					}, function (error) {
						$log.log('查询失败,原因:', error);
						//重新登录获取
						vm.fnLogin().then(function () {
							$rootScope.loading = false;
							vm.fnLoadRecord(from, to);
						}, $rootScope.notify);
					});
				}else{
					//用户信息不存在,重新登录获取
					vm.fnLogin().then(function () {
						vm.fnLoadRecord(from, to);
					}, $rootScope.notify);
				}
			}else{
				$rootScope.notify('请先登陆');
			}
		};

		/**
		 *
		 * @returns {*}
		 */
		vm.fnLogin = function () {
			var defer = $q.defer();
			var username = vm.Account.username;
			var password = vm.Account.password;
			AttendanceService.login(username,password).then(function () {
				//获取用户信息并保存
				AttendanceService.getUserInfo().then(function (res) {
					$rootScope.setConfig('ATTENDANCE_USER',res.data).then(function () {
						vm.User = res.data;
						defer.resolve();
					});
				}, function (error) {
					defer.reject(error);
				});
			});
			return defer.promise;
		};

		/**
		 * 打开modal
		 * @param id
		 */
		vm.fnOpenModal = function (id) {
			var modal = $(id);
			if(angular.isElement(modal)){
				modal.modal('show');
			}
		};

		/**
		 * 查看考勤详细
		 * @param records
		 */
		vm.fnRecordDetail = function (records) {
			RecordModal.modal('show');
			vm.ItemList = records;
		}
	});

