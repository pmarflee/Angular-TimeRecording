using System.Linq;
using System.Web.Http;
using Breeze.ContextProvider;
using Breeze.ContextProvider.EF6;
using Breeze.WebApi2;
using Newtonsoft.Json.Linq;
using TimeRecording.Models;

namespace TimeRecording.Controllers
{
    [BreezeController]
    public class TimesheetController : ApiController
    {
        private readonly EFContextProvider<TimeRecordingDbContext> _contextProvider =
            new EFContextProvider<TimeRecordingDbContext>();

        // ~/breeze/timesheet/Metadata 
        [HttpGet]
        public string Metadata()
        {
            return _contextProvider.Metadata();
        }

        [HttpGet]
        public IQueryable<TimeRecord> Timesheet()
        {
            return _contextProvider.Context.TimeRecords;
        }

        // ~/breeze/timesheet/SaveChanges
        [HttpPost]
        public SaveResult SaveChanges(JObject saveBundle)
        {
            return _contextProvider.SaveChanges(saveBundle);
        }
    }
}