import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { type EventWithDetails } from '@shared/schema';
import { useLocation } from 'wouter';

interface EventCardProps {
  event: EventWithDetails;
  showJoinButton?: boolean;
}

const categoryColors: Record<string, string> = {
  music: 'bg-purple-500/20 text-purple-400',
  sports: 'bg-orange-500/20 text-orange-400',
  'food-drink': 'bg-green-500/20 text-green-400',
  arts: 'bg-pink-500/20 text-pink-400',
  community: 'bg-blue-500/20 text-blue-400',
  business: 'bg-gray-500/20 text-gray-400',
};

export const EventCard = ({ event, showJoinButton = true }: EventCardProps) => {
  const [, setLocation] = useLocation();

  const handleViewDetails = () => {
    setLocation(`/events/${event.id}`);
  };

  const categoryClass = categoryColors[event.category.slug] || 'bg-gray-500/20 text-gray-400';
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

  return (
    <Card className="group hover:border-muted-foreground/50 transition-colors cursor-pointer overflow-hidden">
      <div onClick={handleViewDetails}>
        {event.imageUrl && (
          <div className="w-full h-48 overflow-hidden">
            <img 
              src={event.imageUrl} 
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Badge className={`${categoryClass} border-none`}>
              {event.category.name}
            </Badge>
            <span className="text-muted-foreground text-sm">{formattedDate}</span>
          </div>
          
          <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
            {event.title}
          </h3>
          
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
            {event.description}
          </p>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center text-muted-foreground text-sm">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="truncate">{event.location}</span>
            </div>
            <div className="flex items-center text-muted-foreground text-sm">
              <Clock className="w-4 h-4 mr-1" />
              <span>{event.time}</span>
            </div>
          </div>
          
          {event.maxAttendees && (
            <div className="flex items-center text-muted-foreground text-sm mb-4">
              <Users className="w-4 h-4 mr-1" />
              <span>{event.spotsLeft} spots left</span>
            </div>
          )}
          
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={event.organizer.profilePhoto || undefined} />
                <AvatarFallback className="text-xs">
                  {event.organizer.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">{event.organizer.name}</span>
            </div>
            
            {showJoinButton && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewDetails();
                }}
                className="text-primary hover:text-primary/80"
              >
                View Details
              </Button>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
};
