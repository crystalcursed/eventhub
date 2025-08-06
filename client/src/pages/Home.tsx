import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EventCard } from '@/components/EventCard';
import { EventFilters } from '@/components/EventFilters';
import { EventCardSkeleton } from '@/components/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Parse URL params for initial filters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const initialFilters: Record<string, string> = {};
    
    if (urlParams.get('search')) initialFilters.search = urlParams.get('search')!;
    if (urlParams.get('category')) initialFilters.category = urlParams.get('category')!;
    if (urlParams.get('date')) initialFilters.date = urlParams.get('date')!;
    if (urlParams.get('location')) initialFilters.location = urlParams.get('location')!;
    
    setFilters(initialFilters);
  }, []);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['/api/events', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value as string);
      });
      const response = await fetch(`/api/events?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
    queryFn: async () => {
      const response = await fetch('/api/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  const featuredEvents = events.slice(0, 6);
  const upcomingEvents = events.slice(6, 10);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <section className="mb-12">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            Discover Local Events
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Connect with your community through amazing local events, workshops, and gatherings.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Button onClick={() => setLocation('/create-event')} size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            ) : (
              <Button onClick={() => setLocation('/register')} size="lg">
                Join EventHub
              </Button>
            )}
            <Button variant="outline" size="lg" onClick={() => {
              document.getElementById('events-section')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              Browse Events
            </Button>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="mb-8" id="events-section">
        <EventFilters onFiltersChange={setFilters} initialFilters={filters} />
      </section>

      {/* Featured Events */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Featured Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }, (_, i) => (
              <EventCardSkeleton key={i} />
            ))
          ) : featuredEvents.length > 0 ? (
            featuredEvents.map((event: any) => (
              <EventCard key={event.id} event={event} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground text-lg">No events found matching your criteria.</p>
            </div>
          )}
        </div>
      </section>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Upcoming Events</h2>
            <Button variant="ghost" onClick={() => setLocation('/events')}>
              View All <i className="fas fa-arrow-right ml-1"></i>
            </Button>
          </div>
          
          <div className="space-y-4">
            {upcomingEvents.map((event: any) => (
              <div key={event.id} className="bg-card rounded-lg p-6 border hover:border-muted-foreground/50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-shrink-0">
                    {event.imageUrl && (
                      <img 
                        src={event.imageUrl} 
                        alt={event.title}
                        className="w-20 h-20 md:w-24 md:h-16 object-cover rounded-lg"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${event.category.color}-500/20 text-${event.category.color}-400`}>
                        {event.category.name}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {new Date(event.date).toLocaleDateString()} • {event.time}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-1">{event.title}</h3>
                    <p className="text-muted-foreground text-sm mb-2">{event.description}</p>
                    <div className="flex items-center text-muted-foreground text-sm">
                      <i className="fas fa-map-marker-alt mr-1"></i>
                      <span>{event.location}</span>
                      {event.spotsLeft && (
                        <>
                          <span className="mx-2">•</span>
                          <i className="fas fa-users mr-1"></i>
                          <span>{event.spotsLeft} spots left</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Button onClick={() => setLocation(`/events/${event.id}`)}>
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Stats */}
      {stats && (
        <section className="mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card rounded-lg p-6 text-center border">
              <div className="text-2xl font-bold text-primary">{stats.activeEvents}</div>
              <div className="text-sm text-muted-foreground">Active Events</div>
            </div>
            <div className="bg-card rounded-lg p-6 text-center border">
              <div className="text-2xl font-bold text-green-400">{stats.communityMembers.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Community Members</div>
            </div>
            <div className="bg-card rounded-lg p-6 text-center border">
              <div className="text-2xl font-bold text-purple-400">{stats.eventOrganizers}</div>
              <div className="text-sm text-muted-foreground">Event Organizers</div>
            </div>
            <div className="bg-card rounded-lg p-6 text-center border">
              <div className="text-2xl font-bold text-yellow-400">{stats.eventCategories}</div>
              <div className="text-sm text-muted-foreground">Event Categories</div>
            </div>
          </div>
        </section>
      )}

      {/* Floating Action Button */}
      {user && (
        <Button
          onClick={() => setLocation('/create-event')}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg hover:scale-110 transition-all duration-200 z-40"
          size="icon"
        >
          <Plus className="w-6 h-6" />
        </Button>
      )}
    </main>
  );
}
