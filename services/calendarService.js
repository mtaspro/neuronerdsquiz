import axios from 'axios';
import ical from 'ical';

class CalendarService {
  constructor() {
    this.calendarUrls = {
      muslim: 'https://calendar.google.com/calendar/ical/en-gb.islamic%23holiday%40group.v.calendar.google.com/public/basic.ics',
      bangladesh: 'https://calendar.google.com/calendar/ical/en.bd%23holiday%40group.v.calendar.google.com/public/basic.ics'
    };
  }

  // Convert English date to Bangla date (Bengali calendar)
  toBanglaDate(date) {
    const banglaMonths = [
      'বৈশাখ', 'জ্যৈষ্ঠ', 'আষাঢ়', 'শ্রাবণ', 'ভাদ্র', 'আশ্বিন',
      'কার্তিক', 'অগ্রহায়ণ', 'পৌষ', 'মাঘ', 'ফাল্গুন', 'চৈত্র'
    ];

    const banglaNumbers = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    
    // Simple approximation for Bengali calendar
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    // Bengali year is approximately 593-594 years behind Gregorian
    const banglaYear = year - 593;
    
    // Approximate month mapping (Bengali new year starts around April 14)
    let banglaMonth = month - 3; // April = 0 in Bengali calendar
    if (banglaMonth < 0) banglaMonth += 12;
    
    // Convert numbers to Bangla
    const banglaDay = day.toString().split('').map(d => banglaNumbers[parseInt(d)]).join('');
    const banglaYearStr = banglaYear.toString().split('').map(d => banglaNumbers[parseInt(d)]).join('');
    
    return `${banglaDay} ${banglaMonths[banglaMonth]} ${banglaYearStr} বঙ্গাব্দ`;
  }

  // Convert English date to Hijri date (approximation)
  toHijriDate(date) {
    const hijriMonths = [
      'Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani',
      'Jumada al-awwal', 'Jumada al-thani', 'Rajab', 'Sha\'ban',
      'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
    ];

    // Simple approximation: Hijri year is about 11 days shorter
    const gregorianYear = date.getFullYear();
    const dayOfYear = Math.floor((date - new Date(gregorianYear, 0, 0)) / 86400000);
    
    // Approximate Hijri year (622 CE = 1 AH)
    const hijriYear = Math.floor((gregorianYear - 622) * 1.030684) + 1;
    
    // Approximate month and day
    const hijriDayOfYear = Math.floor(dayOfYear * 354 / 365);
    const hijriMonth = Math.floor(hijriDayOfYear / 29.5);
    const hijriDay = Math.floor(hijriDayOfYear % 29.5) + 1;
    
    return `${hijriDay} ${hijriMonths[hijriMonth % 12]} ${hijriYear}`;
  }

  // Fetch holidays from ICS feeds
  async fetchHolidays(date) {
    const holidays = [];
    const dateStr = date.toISOString().split('T')[0];

    try {
      for (const [type, url] of Object.entries(this.calendarUrls)) {
        try {
          const response = await axios.get(url, { timeout: 10000 });
          const events = ical.parseICS(response.data);
          
          for (const event of Object.values(events)) {
            if (event.type === 'VEVENT' && event.start) {
              const eventDate = new Date(event.start);
              const eventDateStr = eventDate.toISOString().split('T')[0];
              
              if (eventDateStr === dateStr) {
                holidays.push({
                  title: event.summary,
                  type: type,
                  date: eventDate
                });
              }
            }
          }
        } catch (error) {
          console.error(`Failed to fetch ${type} holidays:`, error.message);
        }
      }
    } catch (error) {
      console.error('Error fetching holidays:', error);
    }

    return holidays;
  }

  // Generate daily calendar message
  async generateDailyMessage() {
    const now = new Date();
    const bangladeshTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Dhaka"}));
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayName = dayNames[bangladeshTime.getDay()];
    const day = bangladeshTime.getDate();
    const month = monthNames[bangladeshTime.getMonth()];
    const year = bangladeshTime.getFullYear();

    const englishDate = `${day} ${month} ${year}`;
    const banglaDate = this.toBanglaDate(bangladeshTime);
    const hijriDate = this.toHijriDate(bangladeshTime);

    // Fetch holidays
    const holidays = await this.fetchHolidays(bangladeshTime);

    let message = `📅 **Today:** ${dayName}, ${englishDate}\n`;
    message += `🗓️ **English Date:** ${englishDate}\n`;
    message += `🗓️ **বাংলা তারিখ:** ${banglaDate}\n`;
    message += `🕌 **Hijri Date:** ${hijriDate}\n\n`;

    if (holidays.length > 0) {
      const holidayTitles = holidays.map(h => h.title).join(', ');
      message += `🎉 **Special:** ${holidayTitles}\n`;
      
      // Add appropriate wishes based on holiday type
      if (holidays.some(h => h.title.toLowerCase().includes('eid'))) {
        message += `✨ *Eid Mubarak! May this blessed day bring joy and peace ❤️*`;
      } else if (holidays.some(h => h.title.toLowerCase().includes('independence') || h.title.toLowerCase().includes('victory'))) {
        message += `✨ *Let's honor our nation and heroes today 🇧🇩❤️*`;
      } else if (holidays.some(h => h.title.toLowerCase().includes('mourning'))) {
        message += `✨ *Let's honor our heroes today ❤️*`;
      } else {
        message += `✨ *Wishing everyone a blessed and joyful day! 🌟*`;
      }
    } else {
      message += `💡 *No special events today. Let's make it productive!*`;
    }

    return message;
  }
}

export default CalendarService;