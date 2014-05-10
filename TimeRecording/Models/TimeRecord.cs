using System;
using System.ComponentModel.DataAnnotations;

namespace TimeRecording.Models
{
    public class TimeRecord
    {
        public int Id { get; set; }

        [Required]
        public string Description { get; set; }

        [Required]
        public DateTime TimeFrom { get; set; }

        [Required]
        public DateTime TimeTo { get; set; }
    }
}