class PagedResponse<T> {
  PagedResponse({
    required this.data,
    required this.page,
    required this.pageSize,
    required this.total,
  });

  final List<T> data;
  final int page;
  final int pageSize;
  final int total;

  factory PagedResponse.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic>) fromJsonT,
  ) {
    final raw = json['data'];
    return PagedResponse(
      data: raw is List
          ? raw
              .whereType<Map<String, dynamic>>()
              .map(fromJsonT)
              .toList()
          : [],
      page: json['page'] as int? ?? 1,
      pageSize: json['pageSize'] as int? ?? 20,
      total: json['total'] as int? ?? 0,
    );
  }
}

class ApiException implements Exception {
  ApiException(this.message, {this.status = 0, this.code});

  final String message;
  final int status;
  final String? code;

  @override
  String toString() => message;
}
