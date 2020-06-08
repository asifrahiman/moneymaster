var app = angular.module("moneymaster", ['angularUtils.directives.dirPagination']); 
app.controller("myCtrl", function($scope, $filter,$http) {
	$scope.users = [];
	$http({
      method: 'GET',
      url: 'http://localhost:5001/moneymaster/user'
	}).then(function (success){
		var _len = success.data.length;
		var  post, i;
		for (i = 0; i < _len; i++) {
			//debugger
			post = success.data[i];
			$scope.users.push({'User':post.user,'Id':post.id});
		}
	},function (error){
		alert(error.data);
	}); 
	
});