/**
 * 首页控制器
 */
'use strict';

angular.module('qnsofterApp')
	.controller('HomeCtrl', function($scope, $rootScope, $log, AvosService, AvosRESTApi){
    var LoginDialog    = $('#loginDialog');
    var QrcodeDialog   = $('#qrcodeDialog');
    var vm = $scope.vm = {};
    var url = 'http://qnsofter.avosapps.com/';
    vm.av          = {};
    $scope.formType = false;
    $scope.editing = false;

    /**
     * 获取系统参数
     * @param  {[type]} items [description]
     * @return {[type]}       [description]
     */
    $rootScope.getConfig(['USER_ENCODE','ATTENDANCE_ACCOUNT']).then(function (items) {
      // $rootScope.User = items['USER'];
      vm.encodeString = items['USER_ENCODE'];
      vm.attendanceAccount = items['ATTENDANCE_ACCOUNT'] || {};
    });

    /**
     * 获取当前用户
     * @param  {[type]} user [description]
     * @return {[type]}      [description]
     */
    AvosService.getCurrentUser().then(function(user){
      if(user){
        console.log('user:',user);
        $rootScope.User = user.attributes;
      }
    });

    /**
     * 账号注销
     * @return {[type]} [description]
     */
    vm.fnLogout = function () {
      $rootScope.setConfig('USER_ENCODE').then(function () {
        $rootScope.notify('注销成功!', 'success');
        delete $rootScope.User;
        AV.User.logOut();
      });
    };

    /**
     * 修改个人资料
     * @return {[type]} [description]
     */
    vm.fnEditProfile = function(){
      vm.editing = true;
      vm.tempNickname = $rootScope.User.nickname;
    };

    /**
     * 取消选择
     * @return {[type]} [description]
     */
    vm.fnCancelEdit = function(){
      delete vm.tempAvatar;
      delete vm.tempAvatarFile;
      delete vm.tempNickname;
      vm.editing = false;
    };

    /**
     * 保存用户
     * @return {[type]} [description]
     */
    vm.fnUpdateUser = function(){
      var data = {};
      AV.Promise.when([(function(){
        //是否有更新头像
        if(vm.tempAvatarFile){
          var avatarFile = new AV.File(vm.tempAvatarFile.name, vm.tempAvatarFile);
          return avatarFile.save().then(function(){
            data.avatar = avatarFile;
            return AV.Promise.as();
          }, AV.Promise.error());
        }else{
          return AV.Promise.as();
        }
      })(),(function(){
        //是否有更新昵称
        if(vm.tempNickname != $rootScope.User.nickname){
          data.nickname = vm.tempNickname;
        }
        return AV.Promise.as();
      })()]).then(function(){
        //保存用户资料
        $rootScope.loading = true;
        AvosService.updateUser(data).then(function(user){
          //保存成功
          $rootScope.loading = false;
          $log.debug('保存成功!,用户:',user);
          $rootScope.notify('保存成功!','success');
          $rootScope.User = user.attributes;
          //取消编辑状态
          vm.fnCancelEdit();
        }, function(error){
          $rootScope.loading = false;
          $log.debug('保存失败!,错误代码:',error.code);
        });
      })
    };

    /**
     * 打开二维码框
     * @return {[type]} [description]
     */
    vm.fnToggleQrcodeDialog = function(){
      QrcodeDialog.modal('toggle');
    };

    /**
     * 二维码框关闭后检查用户是否绑定设备
     * @return {[type]} [description]
     */
    QrcodeDialog.on('hide.bs.modal', function(){
      AvosService.getCurrentUser().then(function(user){
        if(user.get('installationId')){
          $rootScope.notify('绑定手机成功!', 'success');
          $rootScope.User = user.attributes;
        }
      });
    });
    /**
     * 打开登录框
     * @return {null}
     */
    $rootScope.fnToggleLoginDialog = function () {
      LoginDialog.modal('toggle');
    };
    /**
     * 切换登录/注册表单
     * @return {[type]} [description]
     */
    $scope.fnToggleForm = function () {
      $scope.formType = !$scope.formType;
      vm.av = {};
    }
    /**
     * 用户登录
     * @return {[type]} [description]
     */
    $scope.fnLogin = function () {
      $log.debug('开始登录...');
      $rootScope.loading = true;
      AvosService.login(vm.av.username, vm.av.password).then(function (user) {
        $rootScope.loading = false;
        $rootScope.fnToggleLoginDialog();
        $log.debug('登陆成功！用户：',user);
        $rootScope.User = user.attributes;
        //保存考勤账号
        vm.fnSaveAttendanceAccount(user);
        $rootScope.notify('登陆成功！','success');
        vm.encodeString = url + '?q=' + 'eAvuS' + Base64.encode(angular.toJson(_.pick(vm.av,['username','password'])));
        $rootScope.setConfig('USER_ENCODE', vm.encodeString);
        vm.av = {};
      },function (error) {
        $rootScope.loading = false;
        $log.debug('登陆失败！错误：code=%s,message=%s',error.code,error.message);
        switch(error.code){
          case 210:
            $rootScope.notify('用户或密码错误!');
            break;
          case 211:
            $rootScope.notify('用户不存在!');
            break;
          default:
            $rootScope.notify(error.message);
        }
      });
    };
    /**
     * 注册用户
     * @return {[type]} [description]
     */
    $scope.fnRegister = function () {
      $log.debug('注册用户...');
      $rootScope.loading = true;
      AvosService.register(vm.av).then(function(user) {
        $rootScope.notify('注册成功！','success');
	      vm.encodeString = url + '?q=' + 'eAvuS' + Base64.encode(angular.toJson(_.pick(vm.av,['username','password'])));
	      $rootScope.setConfig('USER_ENCODE', vm.encodeString);
	      $rootScope.loading = false;
	      vm.av = {};
	      $rootScope.fnToggleLoginDialog();
	      $log.debug('注册成功!,用户:',user);
	      $rootScope.User = user.attributes;
	      $scope.formType = !$scope.formType;
	      //保存考勤账号
        vm.fnSaveAttendanceAccount(user);
      },function(error) {
        $rootScope.loading = false;
        $log.debug("注册失败!Error: " + error.code + " " + error.error);
        switch(error.code){
          case 125:
            $rootScope.notify('邮箱格式不合法!');
            break;
          case 202:
            $rootScope.notify('用户名已被注册!');
            break;
          case 203:
            $rootScope.notify('邮箱已被注册!');
            break;
          default:
            $rootScope.notify(error.message);
        }
      });
    };

    /**
     * 保存考勤账号
     * @return {[type]} [description]
     */
    vm.fnSaveAttendanceAccount = function(user){
      user.set('attendanceAccount', vm.attendanceAccount);
      user.save(null).then(function(){
        $log.debug('保存考勤账号成功!');
      },function(error){
        $log.debug('保存考勤账号失败,错误代码:',error.code);
      });
    };

    /**
     * 选择图片
     * @param  {[type]} files [description]
     * @return {[type]}       [description]
     */
    vm.fnSelectFile = function(files){
      var file = files[0];
      if(file){
        if(file.size > 1024*200){
          $rootScope.notify('请上传小于200K的头像');
          return;
        }
        vm.tempAvatarFile = file;
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function(e){
          var imgSrc = this.result;
          $scope.$apply(function(){
            vm.tempAvatar = imgSrc;
          });
        }
      }
    };

    /**
     * 解除手机绑定
     * @return {[type]} [description]
     */
    vm.fnUnbound = function(){
      if(!$rootScope.User.installationId) return;
      var msg = Messenger().post({
        message: '解除手机绑定?',
        id: 'attendance',
        type: 'error',
        actions: {
          sure: {
            label: '确定',
            action: function() {
	            //推送消息
	            var pushData = {
		            data: {
			            action: 'org.qnsofter.REMOVE_INSTALLATION_ID'
		            },
		            where: {
			            installationId: $rootScope.User.installationId
		            }
	            };
	            AvosRESTApi.push(pushData).then(function (argument) {
		            $log.debug('推送成功!','success');
	            }, function (error) {
		            $log.debug('推送消息失败,错误代码:',error.code);
	            });
              AvosService.updateUser({installationId: ''}).then(function(user){
                $rootScope.User = user.attributes;
                msg.hide();
                $rootScope.notify('解除成功!');
              });
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
    }

	});
