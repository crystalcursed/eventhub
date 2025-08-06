import { useQuery } from '@tanstack/react-query';
import { Plus, Calendar, MapPin, Users, Edit, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { EventCardSkeleton } from '@/components/LoadingSpinner';

export default function MyEvents() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['/api/users/me/events'],
    queryFn: async () => {
      const response = await fetch('/api/users/me/events', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    },
    enabled: !!user,
  });

  if (!user) {
    setLocation('/login');
    return null;
  }

  const categoryColors: Record<string, string> = {
    music: 'bg-purple-500/20 text-purple-400',
    sports: 'bg-orange-500/20 text-orange-400',
    'food-drink': 'bg-green-500/20 text-green-400',
    arts: 'bg-pink-500/20 text-pink-400',
    community: 'bg-blue-500/20 text-blue-400',
    business: 'bg-gray-500/20 text-gray-400',
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Events</h1>
          <p className="text-muted-foreground mt-2">
            Manage your events and track attendance
          </p>
        </div>
        <Button onClick={() => setLocation('/create-event')}>
          <Plus className="w-4 h-4 mr-2" />
          Create Event
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }, (_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mb-4">
              <Calendar className="w-16 h-16 mx-auto text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No events yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first event to start building your community.
            </p>
            <Button onClick={() => setLocation('/create-event')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event: any) => {
            const categoryClass = categoryColors[event.category.slug] || 'bg-gray-500/20 text-gray-400';
            const eventDate = new Date(event.date);
            const formattedDate = eventDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const isPastEvent = eventDate < new Date();

            return (
              <Card key={event.id} className="hover:border-muted-foreground/50 transition-colors">
                {event.imageUrl && (
                  <div className="w-full h-48 overflow-hidden rounded-t-lg">
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={`${categoryClass} border-none`}>
                      {event.category.name}
                    </Badge>
                    <span className="text-muted-foreground text-sm">{formattedDate}</span>
                    {isPastEvent && (
                      <Badge variant="secondary" className="text-xs">
                        Past
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                    {event.title}
                  </h3>
                  
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {event.description}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-muted-foreground text-sm">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    
                    {event.maxAttendees && (
                      <div className="flex items-center text-muted-foreground text-sm">
                        <Users className="w-4 h-4 mr-2" />
                        <span>
                          {event.currentAttendees} / {event.maxAttendees} attendees
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setLocation(`/events/${event.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setLocation(`/events/${event.id}/edit`)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
