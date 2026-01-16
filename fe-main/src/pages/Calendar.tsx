import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Calendar as CalendarIcon, Clock, MapPin } from "lucide-react";

export default function Calendar() {
  const events = [
    {
      month: "January 2025",
      items: [
        { date: "15", title: "Applications Open", desc: "Registration begins for all main categories.", type: "Milestone" },
        { date: "25", title: "Q&A Webinar Series", desc: "Online sessions with technical committee.", type: "Event" },
      ]
    },
    {
      month: "March 2025",
      items: [
        { date: "15", title: "Application Deadline", desc: "Last day to submit team proposals.", type: "Deadline", urgent: true },
        { date: "20", title: "Pre-Evaluation Results", desc: "Announcement of teams passing the first round.", type: "Result" },
      ]
    },
    {
      month: "May 2025",
      items: [
        { date: "01", title: "Detailed Design Report", desc: "Submission deadline for technical reports.", type: "Deadline", urgent: true },
        { date: "15", title: "Semi-Finals", desc: "Regional competitions begin.", type: "Event" },
      ]
    },
    {
      month: "August 2025",
      items: [
        { date: "20", title: "Grand Final: Istanbul", desc: "The main festival week begins at Atatürk Airport.", type: "Festival" },
        { date: "25", title: "Award Ceremony", desc: "Winners announced by the President.", type: "Ceremony" },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-grow pt-28 pb-16 container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-primary/50 text-primary uppercase tracking-widest">Schedule</Badge>
          <h1 className="text-4xl md:text-6xl font-bold font-display mb-6">Important Dates</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Mark your calendars. Don't miss any deadlines on your journey to the finals.
          </p>
        </div>

        <div className="max-w-4xl mx-auto relative">
          {/* Vertical Line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-border md:-translate-x-1/2"></div>

          <div className="space-y-12">
            {events.map((group, groupIndex) => (
              <div key={group.month} className="relative">
                {/* Month Header */}
                <div className="flex items-center justify-start md:justify-center mb-8 pl-12 md:pl-0">
                  <span className="bg-primary/10 text-primary border border-primary/20 px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider backdrop-blur-sm z-10">
                    {group.month}
                  </span>
                </div>

                <div className="space-y-8">
                  {group.items.map((event, index) => (
                    <div key={index} className={`flex flex-col md:flex-row gap-8 relative items-start ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                      
                      {/* Timeline Dot */}
                      <div className={`absolute left-4 md:left-1/2 w-4 h-4 rounded-full border-4 border-background md:-translate-x-1/2 mt-1.5 z-10
                        ${event.urgent ? 'bg-destructive ring-4 ring-destructive/20' : 'bg-primary ring-4 ring-primary/20'}
                      `}></div>

                      {/* Content Card */}
                      <div className="flex-1 pl-12 md:pl-0 w-full md:w-[calc(50%-2rem)]">
                        <Card className={`overflow-hidden transition-all hover:shadow-lg hover:border-primary/50 ${event.urgent ? 'border-destructive/50 bg-destructive/5' : ''}`}>
                          <div className="p-6">
                            <div className="flex justify-between items-start mb-2">
                              <span className={`text-3xl font-bold font-display ${event.urgent ? 'text-destructive' : 'text-primary'}`}>
                                {event.date}
                              </span>
                              <Badge variant={event.urgent ? "destructive" : "secondary"}>{event.type}</Badge>
                            </div>
                            <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                            <p className="text-muted-foreground text-sm">{event.desc}</p>
                          </div>
                        </Card>
                      </div>

                      {/* Empty Space for Grid */}
                      <div className="hidden md:block flex-1"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
