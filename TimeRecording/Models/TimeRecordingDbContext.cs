using System.Data.Entity;

namespace TimeRecording.Models
{
    public class TimeRecordingDbContext : DbContext
    {
	static TimeRecordingDbContext()
	{
	    Database.SetInitializer(new TimeRecordingDatabaseInitialiser());
	}

        public DbSet<TimeRecord> TimeRecords { get; set; }
    }
}