/**
 * 外卖控制器
 */
'use strict';

angular.module('qnsofterApp')
	.controller('RestaurantCtrl', function($scope, $rootScope, $log, RestaurantService, AvosRESTApi){
		var BillModal = $('#billModal');
		var vm = $scope.vm = {};
		vm.RestaurantList = [];  //外卖餐厅列表
		/* 读取配置信息 */
		$rootScope.getConfig(['RESTAURANT_ORDER_INFO','RESTAURANT_CURRENT_OBJ']).then(function (items) {
			$log.debug('订餐数据对象:', items['RESTAURANT_ORDER_INFO']);
			//已选餐厅id
			vm.RestaurantId = items['RESTAURANT_CURRENT_OBJ'];
			//获取餐厅列表
			vm.fnGetRestaurantList();
			//已选菜单数据
			vm.OrderObj = items['RESTAURANT_ORDER_INFO'] || {
				OrderList: [],		//点单列表
				totalCount: 0,		//订餐总数
				bill: 0						//订餐总价
			};;
		});

		//监听订单数据变动
		$scope.$watch('vm.OrderObj',function (newvalue, oldvalue) {
			//保存变动后的订单数据
			$rootScope.setConfig({
				'RESTAURANT_ORDER_INFO': newvalue,
				'RESTAURANT_CURRENT_OBJ': vm.RestaurantId
			});
		},true);


		/**
		 * 获取外卖餐厅列表
		 */
		vm.fnGetRestaurantList = function(){
			RestaurantService.load().then(function (restaurantList) {
				console.log('外卖数据加载完毕;');
				vm.RestaurantList = restaurantList;
				vm.Restaurant = vm.RestaurantList.filter(function(index) {
								return index.objectId == vm.RestaurantId;
							})[0];
			})
		};

		/**
		 * 选择餐厅
		 */
		vm.fnSelectRestaurant = function(){
			vm.Restaurant = vm.RestaurantList.filter(function(index) {
				return index.objectId == vm.RestaurantId;
			})[0];
			vm.fnReset();
		}

		/**
		 * 重置订餐数据
		 * @return {[type]} [description]
		 */
		vm.fnReset = function () {
			vm.OrderObj = {
				OrderList: [],
				totalCount: 0,
				bill: 0
			};
		}

		/**
		 * 点菜行为
		 * @param menu 所点菜品
		 */
		vm.fnAddOrder = function(menu){
			var element;
			//判断是否已有该菜品
			element = _.find(vm.OrderObj.OrderList,function(obj){
				return obj.name == menu.name;
			});
			if(!element) {
				//添加
				element = {
					name: menu.name,
					num: 1,
					price: menu.price
				};
				vm.OrderObj.OrderList.push(angular.copy(element));
			}else{
				//更新数量
				element.num++
			}
			vm.OrderObj.bill += menu.price*1;
			vm.OrderObj.totalCount ++;
		};

		/**
		 * 取消点菜
		 * @param index 已点菜品索引
		 */
		vm.fnRemoveOrder = function(index){
			var element = vm.OrderObj.OrderList[index];
			element.num --;
			vm.OrderObj.totalCount --;
			vm.OrderObj.bill -= element.price*1;
			if(element.num == 0) {
				vm.OrderObj.OrderList.splice(index, 1);
			}
		};
		/**
		 * 查看已点菜品
		 */
		vm.fnShowBill = function(){
			BillModal.modal('show');
		};

		/**
		 * 推送打电话消息
		 * @param  {[type]} pushId [description]
		 * @return {[type]}        [description]
		 */
		vm.fnCall = function(pushId){
			var pushData = {
				data: {
					phone: vm.Restaurant.phone,
					action: 'org.qnsofter.CALL_PHONE'
				},
				where: {
					installationId: pushId
				}
			};
			AvosRESTApi.push(pushData).then(function (argument) {
				$rootScope.notify('拨打成功!','success');
			}, function (error) {
				$rootScope.notify('拨打失败!');
				$log.debug('推送打电话消息失败,错误代码:',error.code);
			});
		};
	});

