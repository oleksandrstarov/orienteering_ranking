'use strict';

describe('Controller: HomeController', function () {

  // load the controller's module
  beforeEach(module('app'));

  var $controller;

  // Initialize the controller and a mock scope
  beforeEach(inject(function (_$controller_) {
    $controller = _$controller_;
    
  }));

  it('HomeController check', function () {
    var $scope = {};
    var controller = $controller('HomeController', {
      $scope: $scope
    });
    console.log(controller);
    
    expect(controller.info.length).toBe(0);
  });
});
