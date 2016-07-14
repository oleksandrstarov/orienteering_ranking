'use strict';

angular.module('confusionApp')

    .controller('MenuController', ['$scope', 'menuFactory', function($scope, menuFactory) {
        $scope.tab = 1;
        $scope.filtText = '';
        $scope.showDetails = false;
        $scope.showMenu = false;
        $scope.message = 'Loading...';
        
        $scope.dishes = menuFactory.getDishes().query( 
            function(response){
                $scope.dishes = response;
                $scope.showMenu = true;
            },
            function(response){
                $scope.message = 'Error: ' + response.status + ' ' + response.statusText;
            });
        
        $scope.select = function(setTab){
            if (setTab === 2){
                $scope.filtText = "appetizer";
            }
            else if (setTab === 3){
                $scope.filtText = "mains";
            }
            else if (setTab === 4){
                $scope.filtText = "dessert";
            }
            else{
                $scope.filtText = "";
            }
            $scope.tab = setTab;
        };
        
        $scope.isSelected = function(checkTab){
            return ($scope.tab === checkTab);
        };
        
        $scope.toggleDetails = function(){
            $scope.showDetails = !$scope.showDetails;
        };
        
        
    }])
    
    .controller('ContactController', ['$scope', function($scope){
        $scope.feedback = {
            mychannel:'',
            firstName:'',
            lastName:'',
            agree:false,
            email:''
        };
        var channels = [{value:'tel', label:'Tel.'},
                        {value:'Email', label:'Email'}];
        $scope.channels = channels;
        $scope.invalidChanellSelection = false;
        
    }])
    
    .controller('FeedbackController', ['$scope', 'feedbackFactory', function($scope, feedbackFactory){
        $scope.sendFeedback = function(){
            console.log($scope.feedback); 
            if ($scope.feedback.agree && ($scope.feedback.mychannel === "")&& !$scope.feedback.mychannel) {
                $scope.invalidChannelSelection = true;
                console.log('incorrect');
            }
            else {
                $scope.invalidChannelSelection = false;
                feedbackFactory.updateFeedback().update($scope.feedback);
                $scope.feedback = {
                    mychannel:"", 
                    firstName:"",  
                    lastName:"",
                    agree:false, 
                    email:"" 
    
            };
            
            $scope.feedback.mychannel="";

            $scope.feedbackForm.$setPristine();
            console.log($scope.feedback);
            }
        };
    }])
    
    .controller('DishDetailController', ['$scope','$stateParams', 'menuFactory', function($scope, $stateParams, menuFactory){
           /* console.log('test');
            $scope.predicate = '';
            $scope.reverse = false;
            if($scope.predicate.indexOf('-') === 0){
                $scope.reverse = true;
            }*/
            //console.log($routeParams.id);
            
            $scope.showDish = false;
            $scope.message = 'Loading...';
            $scope.dish = menuFactory.getDishes().get({id:parseInt($stateParams.id,10)})
                .$promise.then(
                    function(response){
                        $scope.dish = response;
                        $scope.showDish = true;
                    },
                    function(response){
                        $scope.message = 'Error: ' + response.status + ' ' + response.statusText;
                    }
                )
            ;
            $scope.orderByList = [
                {value: 'rating', label: 'Rating'},
                {value: 'comment', label: 'Comment'},
                {value: 'author', label: 'Author'},
                {value: 'date', label: 'Date'}
            ];
            
    }])
    
     .controller('DishCommentController', ['$scope','menuFactory', function($scope, menuFactory) {
        
        $scope.userComment = {
            rating:5,
            comment:'',
            author:'',
            date: null
        };
        
        $scope.submitComment = function () {
            $scope.userComment.rating = Number($scope.userComment.rating);
            
            $scope.userComment.date = new Date().toISOString();
            
            $scope.dish.comments.push($scope.userComment);
            
            menuFactory.getDishes().update({id:$scope.dish.id}, $scope.dish);
            
            $scope.userCommentForm.$setPristine();
            
            $scope.userComment = {
                rating:5,
                comment:'',
                author:'',
                date: null
            };
            
                            
        };
    }])
    
    .controller('IndexController', ['$scope', 'menuFactory', 'corporateFactory', function($scope, menuFactory, corporateFactory){
       
        $scope.showFeatured = false;
        $scope.showPromo = false;
        $scope.showLeader = false;
        $scope.messageFeatured = 'Loading...';
        $scope.messagePromo = 'Loading...';
        $scope.messageLeader = 'Loading...';
        
         $scope.featured = menuFactory.getDishes().get({id:3})
            .$promise.then(
                function(response){
                    $scope.featured = response;
                    $scope.showFeatured = true;
                },
                function(response){
                    $scope.messageFeatured = 'Error: ' + response.status + ' ' + response.statusText;
                }
            )
        ;
        $scope.promo = menuFactory.getPromotion().get({id:0})
            .$promise.then( function(response){
                $scope.promo = response;
                $scope.showPromo = true;
            },
            function(response){
                $scope.messagePromo = 'Error: ' + response.status + ' ' + response.statusText;
            });
     
        $scope.leader = corporateFactory.getLeaders().get({id:3})
         .$promise.then( function(response){
                $scope.leader = response;
                $scope.showLeader = true;
            },
            function(response){
                $scope.messageLeader = 'Error: ' + response.status + ' ' + response.statusText;
            });
    }])

    .controller('AboutController', ['$scope', 'corporateFactory', function($scope, corporateFactory){
        $scope.showLeader = false;
        $scope.messageLeader = 'Loading...';
        $scope.leaders = corporateFactory.getLeaders().query(
            function(response){
                $scope.dishes = response;
                $scope.showLeader = true;
            },
            function(response){
                $scope.message = 'Error: ' + response.status + ' ' + response.statusText;
            }
        );
    }])
;