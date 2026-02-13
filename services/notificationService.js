const Student = require('../models/Student');
const Notification = require('../models/Notification');
const JobPosting = require('../models/JobPosting');

/**
 * Notify students for a job posting
 * Finds all matching students and creates dashboard notifications
 * @param {Object} jobData - JobPosting document
 * @returns {Object} { success: boolean, notified: number, message: string }
 */
const notifyStudentsForJob = async (jobData) => {
  try {
    // Find all students matching the target qualifications
    const matchingStudents = await Student.find({
      qualification: { $in: jobData.targetQualifications },
      status: 'Active',
      'jobAlerts.enabled': true,
    }).select('_id email name qualification');

    if (!matchingStudents || matchingStudents.length === 0) {
      console.log(`No matching students found for job: ${jobData.jobId}`);
      return {
        success: true,
        notified: 0,
        message: 'No matching students found for this job',
      };
    }

    // Prepare notification data
    const notifications = matchingStudents.map((student) => {
      // Build notification title
      const title = `New ${jobData.jobCategory} Job: ${jobData.jobTitle}`;

      // Build notification message
      const qualificationsList = jobData.targetQualifications.join(', ');
      const lastDate = new Date(jobData.lastApplicationDate).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      
      let message = `${jobData.organization} is hiring for ${jobData.jobTitle}. `;
      message += `Qualifications: ${qualificationsList}. `;
      message += `Last Date: ${lastDate}.`;

      // Add exam date for government jobs
      if (jobData.jobCategory === 'Government' && jobData.govtJobFields?.examDate) {
        const examDate = new Date(jobData.govtJobFields.examDate).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        message += ` Exam Date: ${examDate}.`;
      }

      return {
        studentId: student._id,
        jobId: jobData._id,
        jobTitle: jobData.jobTitle,
        organization: jobData.organization,
        jobCategory: jobData.jobCategory,
        title: title,
        message: message,
        importantDates: {
          lastApplicationDate: jobData.lastApplicationDate,
          examDate: jobData.govtJobFields?.examDate || null,
          admitCardDate: jobData.govtJobFields?.admitCardDate || null,
          resultDate: jobData.govtJobFields?.resultDate || null,
        },
      };
    });

    // Bulk insert notifications
    const createdNotifications = await Notification.insertMany(notifications, {
      ordered: false, // Continue inserting even if some fail
    });

    // Update job posting with notification tracking
    const studentIds = matchingStudents.map((s) => s._id);
    
    jobData.notificationTracking = {
      notificationSent: true,
      notificationSentTo: studentIds,
      notificationSentDate: new Date(),
      totalStudentsMatched: matchingStudents.length,
    };

    await jobData.save();

    console.log(
      `Successfully notified ${createdNotifications.length} students for job: ${jobData.jobId}`
    );

    return {
      success: true,
      notified: createdNotifications.length,
      message: `Successfully notified ${createdNotifications.length} students`,
    };
  } catch (error) {
    console.error('Error in notifyStudentsForJob:', error);
    
    // If it's a bulk write error, some notifications may have been created
    if (error.name === 'BulkWriteError') {
      const insertedCount = error.result?.insertedCount || 0;
      return {
        success: true,
        notified: insertedCount,
        message: `Partially notified ${insertedCount} students. Some notifications failed.`,
      };
    }

    throw error;
  }
};

module.exports = {
  notifyStudentsForJob,
};
