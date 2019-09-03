String gql(String input) => input;

String searchPostsQuery = gql("""
query searchPosts(\$lat: Float!, \$lng: Float!, \$km: Int!, \$cursor: Cursor) {
  searchPosts(lat: \$lat, lng: \$lng, km: \$km, first: 20, after: \$cursor) {
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      id
      nodeId
      createdAt
      headline
      locationName
      locationAddress
      price
      oldPrice
      voteSum
      pictureUrls
      authorId
      postCommentsByPostId {
        totalCount
      }
      userByAuthorId {
        nickname
      }
    }
  }
}
""").replaceAll('\n', ' ');
