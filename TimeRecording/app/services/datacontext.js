(function() {
    'use strict';

    var serviceId = 'datacontext';
    angular.module('app').factory(serviceId, ['common', 'breeze', 'logger', datacontext]);

    function datacontext(common, breeze, logger) {
        var $q = common.$q,
            serviceName = 'breeze/timesheet',
            manager = new breeze.EntityManager(serviceName),
            service = {
                getTimesheet: getTimesheet,
                createTimeRecord: createTimeRecord,
                hasChanges: hasChanges,
                saveChanges: saveChanges,
                deleteTimeRecord: deleteTimeRecord
            };

        return service;

        function getTimesheet(selectedDate) {
            // Yet another way to ask the same question
            var tomorrow = moment(selectedDate).add('d', 1)._d;
            var pred = breeze.Predicate.create('TimeFrom', 'ge', selectedDate)
                .and('TimeFrom', 'lt', tomorrow),
                query = breeze.EntityQuery
                    .from("Timesheet")
                    .where(pred)
                    .orderBy("TimeFrom");

            var promise = manager.executeQuery(query).catch(queryFailed);
            return promise;

            function queryFailed(error) {
                logger.logError(error.message, "Query failed");
                throw error; // so downstream promise users know it failed
            }
        }

        function createTimeRecord(data) {
            return manager.createEntity('TimeRecord', data);
        }

        function deleteTimeRecord(data) {
            data && data.entityAspect.setDeleted();
        }
        
        function hasChanges() {
            return manager.hasChanges();
        }

        function saveChanges() {
            return manager.saveChanges()
                .then(saveSucceeded)
                .catch(saveFailed);

            function saveSucceeded(saveResult) {
                logger.logSuccess("# of records saved = " + saveResult.entities.length);
                logger.log(saveResult);
            }

            function saveFailed(error) {
                var reason = error.message;
                var detail = error.detail;

                if (error.entityErrors) {
                    reason = handleSaveValidationError(error);
                } else if (detail && detail.ExceptionType &&
                    detail.ExceptionType.indexOf('OptimisticConcurrencyException') !== -1) {
                    // Concurrency error 
                    reason =
                        "Another user, perhaps the server, " +
                        "may have deleted one or all of the todos." +
                        " You may have to restart the app.";
                } else {
                    reason = "Failed to save changes: " + reason +
                        " You may have to restart the app.";
                }

                logger.logError(error, reason);
                // DEMO ONLY: discard all pending changes
                // Let them see the error for a second before rejecting changes
                $timeout(function () {
                    manager.rejectChanges();
                }, 1000);
                throw error; // so downstream promise users know it failed
            }
        }

        function handleSaveValidationError(error) {
            var message = "Not saved due to validation error";
            try { // fish out the first error
                var firstErr = error.entityErrors[0];
                message += ": " + firstErr.errorMessage;
            } catch (e) { /* eat it for now */ }
            return message;
        }
    }
})();