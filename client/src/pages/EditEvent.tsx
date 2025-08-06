import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Calendar, Clock, MapPin, Image as ImageIcon, Save, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { apiRequest } from '@/lib/api';

export default function EditEvent() {
  const { id } = useParams();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    categoryId: '',
    maxAttendees: '',
    imageUrl: '',
  });
  const [error, setError] = useState('');

  // Fetch event data
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['/api/events', id],
    queryFn: async () => {
      const response = await fetch(`/api/events/${id}`);
      if (!response.ok) throw new Error('Failed to fetch event');
      return response.json();
    },
    enabled: !!id,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
  });

  // Populate form when event data loads
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        date: event.date || '',
        time: event.time || '',
        location: event.location || '',
        categoryId: event.categoryId || '',
        maxAttendees: event.maxAttendees ? event.maxAttendees.toString() : '',
        imageUrl: event.imageUrl || '',
      });
    }
  }, [event]);

  const updateEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const response = await apiRequest('PATCH', `/api/events/${id}`, eventData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/me/events'] });
      setLocation(`/events/${id}`);
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to update event');
    },
  });

  if (!user) {
    setLocation('/login');
    return null;
  }

  if (eventLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="space-y-4">
            <div className="h-10 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
            <div className="grid grid-cols-3 gap-4">
              <div className="h-10 bg-muted rounded" />
              <div className="h-10 bg-muted rounded" />
              <div className="h-10 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event || event.organizerId !== user.id) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="destructive">
          <AlertDescription>Event not found or you don't have permission to edit this event.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.description || !formData.date || !formData.time || !formData.location || !formData.categoryId) {
      setError('Please fill in all required fields');
      return;
    }

    const eventData = {
      ...formData,
      maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : null,
    };

    updateEventMutation.mutate(eventData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button
        variant="ghost"
        onClick={() => setLocation(`/events/${id}`)}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Event
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Edit Event</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Amazing Event Name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="categoryId">Category *</Label>
                <Select value={formData.categoryId} onValueChange={(value) => handleSelectChange('categoryId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(categories as any[]).map((category: any) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Tell people what your event is about..."
                rows={4}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <div className="relative">
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                  />
                  <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <div className="relative">
                  <Input
                    id="time"
                    name="time"
                    type="time"
                    value={formData.time}
                    onChange={handleChange}
                    required
                  />
                  <Clock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxAttendees">Max Attendees</Label>
                <Input
                  id="maxAttendees"
                  name="maxAttendees"
                  type="number"
                  value={formData.maxAttendees}
                  onChange={handleChange}
                  placeholder="Unlimited"
                  min="1"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <div className="relative">
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Venue name or address"
                  required
                />
                <MapPin className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Event Image URL</Label>
              <div className="relative">
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  type="url"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                />
                <ImageIcon className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              <p className="text-sm text-muted-foreground">
                Add a URL to an image that represents your event
              </p>
            </div>
            
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setLocation(`/events/${id}`)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={updateEventMutation.isPending}
              >
                {updateEventMutation.isPending ? (
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Update Event
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}