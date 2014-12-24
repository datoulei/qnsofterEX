/**
 * 验证码指令
 */
'use strict';

angular.module('qnsofterApp')
	.directive('captcha', function() {
		return {
			restrict: 'AE',
			replace: false,
			scope: {
				fnCaptcha: '=captcha'
			},
			template: '<div class="modal-dialog">' +
									'<div class="modal-content">' +
										'<div class="modal-header">' +
											'<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
											'<h4 class="modal-title">登录安徽青牛信息管理系统</h4>' +
										'</div>' +
										'<div class="modal-body">' +
											'<input type="text" ng-model="hysCaptcha" placeholder="请输入验证码"/>' +
											'<img ng-src="http://220.178.7.254:8081/hysdms/jcaptcha.jpg?timestamp={{timestamp}}" alt="点击刷新" ng-click="fnRefreshCaptcha();"/>' +
										'</div>' +
										'<div class="modal-footer">' +
											'<button type="button" class="btn btn-primary" ng-click="fnGetCaptcha(hysCaptcha,$event)" data-loading-text="请稍候...">确定</button>' +
										'</div>' +
									'</div>' +
								'</div>',
			link: function(scope,elem,attr){
				elem.addClass('modal fade');
				attr.tabindex = -1;
				attr.role = 'dialog';
				attr['aria-hidden'] = true;
				elem.modal({
					backdrop: 'static',
					keyboard: false,
					show: false
				});
				scope.timestamp = Date.now();
				scope.fnRefreshCaptcha = function(){
					scope.timestamp = Date.now();
				};
				scope.fnGetCaptcha = function(captcha,event){
					scope.fnCaptcha(captcha,event);
				};
			}
		};
	});
