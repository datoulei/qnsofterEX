/**
 * 意见反馈控制器
 */
'use strict';

angular.module('qnsofterApp')
	.controller('FeedbackCtrl',function($scope,$rootScope,$log,AvosService){
		var vm = $scope.vm = {};
		vm.feedback = {};

		vm.fnSubmit = function () {
			$log.debug(vm.feedback);
			var data = angular.copy(vm.feedback);
			vm.feedback = {};
			AvosService.addFeedback(data).then(function () {
				$rootScope.notify('反馈成功!我们会尽快处理','success');
			},function () {
				$rootScope.notify('反馈失败!');
			});
		}
	});


