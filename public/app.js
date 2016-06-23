/// <reference path="C:\Users\Sathyamoorthy\Desktop\angular.d.ts" />
var app = angular.module("musicApp", ["ngResource"]);

app.factory("Tracks", function ($resource) {
    return $resource("http://104.197.128.152:8000/v1/tracks/:id", { id: '@id' });
});
app.factory("Genres", function ($resource) {
    return $resource("http://104.197.128.152:8000/v1/genres/:id");
});

app.controller("searchCtrl", function ($scope, Tracks, $timeout) {
    $scope.showToastMessage = function (msgString) {
        $scope.toastMessage = msgString;
        $scope.isToastMessageShowON = true;
        $timeout(function () {
            $scope.isToastMessageShowON = false;
        }, 2000);
    };
    $scope.isMainContentLoaded = false; //show initial loading
    $scope.isToastMessageShowON = false;
    
    $scope.tracks = Tracks.query(function () {
        $scope.onTracksLoad();
    }, function () {
        $scope.showToastMessage("Unable to get Tracks List");
    });

    $scope.onTracksLoad = function (pageNum) {
        for (var i = 0; i < $scope.tracks.length; i++) {
            //determine half star 
            if ($scope.tracks[i].rating % 1 != 0)
                $scope.tracks[i].isHalfStarReq = true;
        }
       
        $scope.filteredTracks = $scope.tracks;
        $scope.totalPages = Math.ceil($scope.filteredTracks.length / 12);

        //show main content and stop animation
        $scope.isMainContentLoaded = true;
        $scope.sliceandLoadItemsToShow(pageNum || 1);
    };
    $scope.ngIterate = function (n) {
        var tempList = [];
        var limit = Math.floor(n);
        for (var i = 0; i < limit; i++) {
            tempList.push(i);
        }
        return tempList;
    }
    $scope.searchFunctionality = function (event) {
        if (event.keyCode == 13) {
            //show all track if searchInput is empty
            if ($scope.searchInput == "") {
                $scope.filteredTracks = $scope.tracks;
                $scope.itemsToShow = $scope.filteredTracks.slice(0, 12);
                $scope.totalPages = Math.ceil($scope.filteredTracks.length / 12);
                $scope.currentPage = 1;
            }
            //filter the searchInput
            else {
                $scope.filteredTracks = $scope.tracks.filter(function (item) {
                    return item.title.toLowerCase().search($scope.searchInput.toLowerCase()) !== -1;
                });
                $scope.itemsToShow = $scope.filteredTracks.slice(0, 12);

                //reset page navigation
                $scope.totalPages = Math.ceil($scope.filteredTracks.length / 12);
                $scope.currentPage = 1;
            }
        }
    };
    //determine the list in the page
    $scope.sliceandLoadItemsToShow = function (pageNum) {
        var start = ((pageNum - 1) * 12), end = start + 12;
        $scope.itemsToShow = $scope.filteredTracks.slice(start, end);
        $scope.currentPage = pageNum;

    };
    $scope.tracksReload = function () {
        $scope.tracks = Tracks.query(function () {
            $scope.onTracksLoad($scope.currentPage);
        });
    };


});

app.controller("listMusic", function ($scope, Genres) {
    $scope.genres = Genres.query();
    $scope.navigatePrev = function () {
        if ($scope.currentPage - 1 > 0) {
            $scope.sliceandLoadItemsToShow($scope.currentPage - 1)
        }
    }
    $scope.navigateNext = function () {
        if ($scope.currentPage + 1 <= $scope.totalPages) {
            $scope.sliceandLoadItemsToShow($scope.currentPage + 1)
        }
    }
    $scope.hideEditTrack = function () {
        $scope.item.openEditTrack = false;
    }

});

app.controller("newTrackCtrl", function ($scope, Genres, Tracks) {
    $scope.newTrack = {};
    $scope.newRating = 0;
    $scope.starSelected = function (selected) {
        $scope.newRating = selected;
    };
    $scope.genres = Genres.query();
    $scope.newGenresList = [];
    $scope.hideNewTrack = function () {
        $scope.$parent.$parent.openNewTrack = false;
    };
    $scope.saveNewTrack = function () {
        $scope.newTrack.genres = [];
        $scope.newTrack.rating = $scope.newRating;
        for (var i = 0; i < $scope.newGenresList.length; i++) {
            $scope.newTrack.genres.push($scope.newGenresList[i].id);
        }
        
        var response = Tracks.save($scope.newTrack, function () {
            $scope.showToastMessage("New Track Saved");
            $scope.tracksReload();
        }, function () {
            $scope.showToastMessage("Problem occured");
        });

        //hide the new track once it is saved
        $scope.hideNewTrack();
    };
    $scope.addNewGenre = function () {
        var genreName = $scope.ipNewGenre || "";
        if (genreName != "") {
            $scope.showToastMessage("Please wait..");
            var response = Genres.save({ name: genreName }, function () {
                $scope.showToastMessage("New Genre added");
                $scope.newGenresList.push(response);
            }, function () {
                //onError
                $scope.showToastMessage("Problem occured - adding new genre");
            });
        }
        else {
            $scope.showToastMessage("Enter the new genre name");
        }
    };

});

app.controller("editTrackCtrl", function ($scope, Tracks) {
    $scope.editTrack = {};
    $scope.editTrack.id = $scope.item.id;
    $scope.editTrack.title = $scope.item.title;
    $scope.editTrack.rating = $scope.item.rating;

    $scope.genresList = $scope.item.genres;

    $scope.starSelected = function (selected) {
        $scope.editTrack.rating = selected;
    };

    $scope.hideNewTrack = function () {
        $scope.item.openEditTrack = false;

    };

    $scope.saveNewTrack = function () {
        $scope.editTrack.genres = [];
        for (var i = 0; i < $scope.genresList.length; i++) {
            $scope.editTrack.genres.push($scope.genresList[i].id);
        }
        console.log($scope.editTrack);

        var response = Tracks.save($scope.editTrack, function () {
            //show toastmessage
            $scope.showToastMessage("Track edited");

            $scope.tracksReload();
        }, function () {
            $scope.showToastMessage("Problem occured");
        });
        $scope.hideNewTrack();
    };
});