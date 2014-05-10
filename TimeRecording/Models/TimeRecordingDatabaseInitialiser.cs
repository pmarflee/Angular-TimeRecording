using System;
using System.Data.Entity;

namespace TimeRecording.Models
{
    public class TimeRecordingDatabaseInitialiser : DropCreateDatabaseAlways<TimeRecordingDbContext>
    {
        protected override void Seed(TimeRecordingDbContext context)
        {
            SeedDatabase(context);
        }

        private static void SeedDatabase(TimeRecordingDbContext context)
        {
	    for (var dt = DateTime.Today.AddDays(-15); dt < DateTime.Today; dt = dt.AddDays(1))
	    {
		for (int hour = 9, i = 1; hour < 17; hour++, i++)
		{
		    var record = new TimeRecord
		        {
		            Description = string.Format("Task {0}", i),
		            TimeFrom = dt.AddHours(hour),
		            TimeTo = dt.AddHours(hour + 1)
		        };

		    context.TimeRecords.Add(record);
		}
	    }

            context.SaveChanges();
        }
    }
}