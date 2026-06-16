import 'api_client.dart';

class ContactService {
  ContactService(this._client);

  final ApiClient _client;

  Future<void> submit({
    required String name,
    required String email,
    String? phone,
    String? gameIdea,
    required String consultType,
    required String message,
  }) =>
      _client.post<void>(
        '/contact',
        auth: false,
        data: {
          'name': name,
          'email': email,
          if (phone != null && phone.isNotEmpty) 'phone': phone,
          if (gameIdea != null && gameIdea.isNotEmpty) 'gameIdea': gameIdea,
          'consultType': consultType,
          'message': message,
        },
      );
}
