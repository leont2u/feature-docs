/** Source files a Django app/feature may contain, in analysis order. */
export const DJANGO_FEATURE_FILES = [
  'urls.py',
  'views.py',
  'serializers.py',
  'models.py',
  'permissions.py',
  'services.py',
  'signals.py',
  'tasks.py',
  'admin.py',
  'tests.py',
] as const;

export type DjangoFeatureFile = (typeof DJANGO_FEATURE_FILES)[number];
