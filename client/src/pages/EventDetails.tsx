import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, MapPin, Users, User, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { apiRequest } from '@/lib/api';

export default function EventDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: event, isLoading, error } = useQuery({
    queryKey: ['/api/events', id],
    queryFn: async () => {
      const response = await fetch(`/api/events/${id}`);
      if (!response.ok) throw new Error('Failed to fetch event');
      return response.json();
    },
    enabled: !!id,
  });

  const { data: attendance } = useQuery({
    queryKey: ['/api/events', id, 'attendance'],
    queryFn: async () => {
      const response = await fetch(`/api/events/${id}/attendance`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch attendance');
      return response.json();
    },
    enabled: !!id && !!user,
  });

  const joinEventMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/events/${id}/join`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/events', id, 'attendance'] });
    },
  });

  const leaveEventMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/events/${id}/leave`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/events', id, 'attendance'] });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/events/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      setLocation('/my-events');
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-64 bg-muted rounded-lg" />
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="destructive">
          <AlertDescription>Event not found or failed to load.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const isOrganizer = user?.id === event.organizerId;
  const isAttending = attendance?.isAttending;
  const canJoin = event.maxAttendees ? event.currentAttendees < event.maxAttendees : true;

  const categoryColors: Record<string, string> = {
    music: 'bg-purple-500/20 text-purple-400',
    sports: 'bg-orange-500/20 text-orange-400',
    'food-drink': 'bg-green-500/20 text-green-400',
    arts: 'bg-pink-500/20 text-pink-400',
    community: 'bg-blue-500/20 text-blue-400',
    business: 'bg-gray-500/20 text-gray-400',
  };

  const categoryClass = categoryColors[event.category.slug] || 'bg-gray-500/20 text-gray-400';
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button
        variant="ghost"
        onClick={() => setLocation('/')}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Events
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Event Details */}
        <Card className="lg:col-span-2">
          {event.imageUrl && (
            <div className="w-full h-64 overflow-hidden rounded-t-lg">
              <img
                src={event.imageUrl}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Badge className={`${categoryClass} border-none`}>
                {event.category.name}
              </Badge>
              <span className="text-muted-foreground text-sm">{formattedDate}</span>
            </div>
            
            <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-muted-foreground">
                <Calendar className="w-5 h-5 mr-3" />
                <span>{formattedDate}</span>
              </div>
              
              <div className="flex items-center text-muted-foreground">
                <Clock className="w-5 h-5 mr-3" />
                <span>{event.time}</span>
              </div>
              
              <div className="flex items-center text-muted-foreground">
                <MapPin className="w-5 h-5 mr-3" />
                <span>{event.location}</span>
              </div>
              
              {event.maxAttendees && (
                <div className="flex items-center text-muted-foreground">
                  <Users className="w-5 h-5 mr-3" />
                  <span>
                    {event.currentAttendees} / {event.maxAttendees} attendees
                    {event.spotsLeft && event.spotsLeft > 0 && (
                      <span className="text-green-400 ml-2">
                        ({event.spotsLeft} spots left)
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
            
            <div className="prose dark:prose-invert max-w-none mb-6">
              <h3>About this event</h3>
              <p className="whitespace-pre-wrap">{event.description}</p>
            </div>
            
            {/* Organizer Info */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-3">Organized by</h3>
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={event.organizer.profilePhoto || undefined} />
                  <AvatarFallback>
                    {event.organizer.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{event.organizer.name}</p>
                  <p className="text-sm text-muted-foreground">@{event.organizer.username}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Panel */}
        <div className="space-y-6">
          {/* Join/Leave Event */}
          {user && !isOrganizer && (
            <Card>
              <CardContent className="p-6">
                {isAttending ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => leaveEventMutation.mutate()}
                    disabled={leaveEventMutation.isPending}
                  >
                    {leaveEventMutation.isPending ? (
                      <LoadingSpinner className="w-4 h-4 mr-2" />
                    ) : null}
                    Leave Event
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => joinEventMutation.mutate()}
                    disabled={joinEventMutation.isPending || !canJoin}
                  >
                    {joinEventMutation.isPending ? (
                      <LoadingSpinner className="w-4 h-4 mr-2" />
                    ) : null}
                    {canJoin ? 'Join Event' : 'Event Full'}
                  </Button>
                )}
                
                {(joinEventMutation.error || leaveEventMutation.error) && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertDescription>
                      {joinEventMutation.error?.message || leaveEventMutation.error?.message}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Organizer Actions */}
          {isOrganizer && (
            <Card>
              <CardHeader>
                <CardTitle>Manage Event</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setLocation(`/events/${event.id}/edit`)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Event
                </Button>
                
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this event?')) {
                      deleteEventMutation.mutate();
                    }
                  }}
                  disabled={deleteEventMutation.isPending}
                >
                  {deleteEventMutation.isPending ? (
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Delete Event
                </Button>
                
                {deleteEventMutation.error && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {deleteEventMutation.error.message}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Login prompt for guests */}
          {!user && (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground mb-4">
                  Sign in to join this event and connect with other attendees.
                </p>
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={() => setLocation('/login')}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setLocation('/register')}
                  >
                    Create Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
