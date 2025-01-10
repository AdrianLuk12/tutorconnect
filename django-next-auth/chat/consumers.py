import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from users.models import ChatMessage, Match
import datetime
from django.db.models import Q

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            if self.scope["user"].is_anonymous:
                await self.close()
                return

            self.room_name = self.scope['url_route']['kwargs']['room_name']
            self.room_group_name = f'chat_{self.room_name}'
            
            # Verify that the users are matched
            user_ids = self.room_name.split('_')
            if len(user_ids) != 2:
                await self.close()
                return
                
            try:
                user_a_id, user_b_id = map(int, user_ids)
                if not await self.verify_match(user_a_id, user_b_id):
                    await self.close()
                    return
            except ValueError:
                await self.close()
                return

            # Join room group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.accept()
            
        except Exception as e:
            print(f"Connection error: {str(e)}")
            await self.close()

    async def disconnect(self, close_code):
        try:
            # Leave room group
            if hasattr(self, 'room_group_name'):
                await self.channel_layer.group_discard(
                    self.room_group_name,
                    self.channel_name
                )
        except Exception as e:
            print(f"Disconnect error: {str(e)}")

    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message = text_data_json['message']
            sender_id = int(text_data_json['sender_id'])
            receiver_id = int(text_data_json['receiver_id'])

            # Verify sender is the authenticated user
            if sender_id != self.scope["user"].id:
                return

            # Save message to database
            saved_message = await self.save_message(sender_id, receiver_id, message)
            
            # Broadcast message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'id': saved_message.id,
                    'content': message,
                    'sender_id': sender_id,
                    'receiver_id': receiver_id,
                    'timestamp': saved_message.timestamp.isoformat(),
                    'is_read': False
                }
            )
        except Exception as e:
            print(f"Receive error: {str(e)}")
            # Send error message back to client
            await self.send(text_data=json.dumps({
                'error': 'Failed to send message'
            }))

    async def chat_message(self, event):
        try:
            # Send message to WebSocket
            if 'error' in event:
                await self.send(text_data=json.dumps({
                    'error': event['error']
                }))
            else:
                await self.send(text_data=json.dumps({
                    'id': event['id'],
                    'content': event['content'],
                    'sender_id': event['sender_id'],
                    'receiver_id': event['receiver_id'],
                    'timestamp': event['timestamp'],
                    'is_read': event['is_read']
                }))
        except Exception as e:
            print(f"Chat message error: {str(e)}")

    @database_sync_to_async
    def save_message(self, sender_id, receiver_id, content):
        try:
            User = get_user_model()
            sender = User.objects.get(id=sender_id)
            receiver = User.objects.get(id=receiver_id)
            return ChatMessage.objects.create(
                sender=sender,
                receiver=receiver,
                content=content
            )
        except Exception as e:
            print(f"Save message error: {str(e)}")
            raise

    @database_sync_to_async
    def verify_match(self, user_a_id, user_b_id):
        try:
            # Check if users have a mutual match
            match = Match.objects.filter(
                (Q(user_a_id=user_a_id, user_b_id=user_b_id) |
                Q(user_a_id=user_b_id, user_b_id=user_a_id)),
                status_a='accepted',
                status_b='accepted'
            ).exists()
            return match
        except Exception as e:
            print(f"Verify match error: {str(e)}")
            return False 