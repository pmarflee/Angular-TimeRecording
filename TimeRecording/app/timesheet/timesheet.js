(function() {
    'use strict';
    var controllerId = 'timesheet';
    angular.module('app').controller(controllerId, ['$q', '$scope', 'common', 'datacontext', '$translate', 'dialogs', timesheet]);

    function timesheet($q, $scope, common, datacontext, $translate, dialogs) {
        var getLogFn = common.logger.getLogFn,
            log = getLogFn(controllerId),
            logSuccess = getLogFn(controllerId, 'logSuccess'),
            vm = this,
            editTimeRecord = null, // the record being edited at the moment
            suspendSave = false;

        vm.title = 'Timesheet';
        vm.timesheet = [];
        vm.selectedDate = moment().startOf('day')._d;
        vm.checkDescription = checkDescription;
        vm.updateTimeRecord = updateTimeRecord;
        vm.newTimeRecord = newTimeRecord;
        vm.deleteTimeRecord = deleteTimeRecord;
        vm.saveChanges = saveChanges;
        vm.startEdit = startEdit;
        vm.cancelEdit = cancelEdit;
        vm.inserted = null;
        vm.inEditMode = false;

        $scope.$watch('vm.selectedDate', function() {
            getTimesheet();
        });

        activate();

        function activate() {
            common.activateController([getTimesheet()], controllerId)
                .then(function() { log('Activated Timesheet View'); });
        }

        function getTimesheet() {
            return datacontext.getTimesheet(vm.selectedDate).then(function(data) {
                vm.inserted = null;
                return vm.timesheet = data.results;
            });
        }

        function checkDescription(data) {
            if (!data || data.length == 0) {
                return 'Description is required';
            }
            return null;
        }

        function newTimeRecord() {
            if (vm.inEditMode) return;
            var timeFrom,
                timeFromMax = null,
                timeTo;
            for (var i = 0; i < vm.timesheet.length; i++) {
                timeFrom = vm.timesheet[i].TimeTo;
                if (!timeFromMax || timeFrom > timeFromMax) {
                    timeFromMax = timeFrom;
                }
            }
            timeFromMax = moment(timeFromMax || new Date());
            timeFrom = moment(vm.selectedDate)
                .hours(timeFromMax.hours())
                .minutes(timeFromMax.minutes())
                .seconds(0);
            timeTo = moment(timeFrom).add('h', 1);
            vm.inserted = datacontext.createTimeRecord({
                TimeFrom: timeFrom,
                TimeTo: timeTo
            });
            vm.timesheet.push(vm.inserted);
            vm.inEditMode = true;
        }

        function updateTimeRecord(data, id, rowform) {
            var error;
            if (data.TimeFrom >= data.TimeTo) {
                error = 'Time From must be less than Time To';
                rowform.$setError('TimeFrom', error);
                return error;
            }
            if (isOverlap(data, id)) {
                error = 'Date ranges overlap';
                rowform.$setError('', error);
                return error;
            }
            vm.inEditMode = false;
            return true;
        }

        function saveChanges() {
            if (!vm.inEditMode) {
                save(true);
            }
        }

        function deleteTimeRecord(index) {
            var item = vm.timesheet[index];
            removeItem(item);
            datacontext.deleteTimeRecord(item);
        }

        function startEdit(rowform) {
            if (!vm.inEditMode) {
                rowform.$show();
                vm.inEditMode = true;
            }
        }

        function cancelEdit(rowform, item) {
            rowform.$cancel();
            if (item == vm.inserted) {
                removeItem(item);
                datacontext.deleteTimeRecord(item);
            }
            vm.inEditMode = false;
        }

        function save(force) {
            // Save if have changes to save AND
            // if must save OR (save not suspended AND not editing a time record)
            if (datacontext.hasChanges() &&
                (force || (!suspendSave && !editTimeRecord))) {
                var dlg = dialogs.confirm('Save Timesheet', 'Are you sure you want to save?');
                dlg.result.then(function() {
                    return datacontext.saveChanges().then(success);
                }, function() {
                });
            }
            // Decided not to save; return resolved promise w/ no result
            return $q.when(false);

            function success() {
                vm.inserted = null;
                logSuccess('Timesheet updated');
            }
        }

        function isOverlap(data, id) {
            for (var i = 0; i < vm.timesheet.length; i++) {
                var other = vm.timesheet[i];
                if (id !== other.Id && data.TimeFrom < other.TimeTo && data.TimeTo > other.TimeFrom) {
                    return true;
                }
            }
            return false;
        }

        function removeItem(item) {
            // remove the item from the list of presented items
            // N.B.: not a delete; it may still exist in cache and the db
            vm.timesheet = vm.timesheet.filter(function(i) {
                return i !== item;
            });
        }
    }
})();