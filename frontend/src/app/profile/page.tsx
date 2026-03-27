'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { userService } from '@/lib/user'
import { User, UserUpdateData } from '@/types/user'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CardSkeleton } from '@/components/ui/LoadingStates'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { AppLayout } from '@/components/layout/AppLayout'
import { User as UserIcon, Mail, Phone, Calendar, MapPin, Edit2, Save, X } from 'lucide-react'

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [userData, setUserData] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<UserUpdateData>({})

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    fetchUserData()
  }, [user, router])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      setError(null)
      if (user?.id) {
        const response = await userService.getUserById(user.id)
        setUserData(response.data)
        setEditData(response.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user data')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setEditData({
      name: userData?.name || '',
      phone_number: userData?.phone_number || '',
      address: userData?.address || '',
      date_of_birth: userData?.date_of_birth || '',
      gender: userData?.gender || '',
      bio: userData?.bio || '',
    })
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditData({})
  }

  const handleSave = async () => {
    try {
      if (!user?.id) return

      setLoading(true)
      const response = await userService.updateUser(user.id, editData)
      setUserData(response.data)
      setIsEditing(false)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user data')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading && !userData) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          </div>
          <CardSkeleton />
        </div>
      </AppLayout>
    )
  }

  if (error && !userData) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          </div>
          <ErrorDisplay error={error} onRetry={fetchUserData} />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          {!isEditing ? (
            <Button onClick={handleEdit} variant="outline">
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button onClick={handleSave} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save'}
              </Button>
              <Button onClick={handleCancel} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>

      {/* Profile Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserIcon className="h-5 w-5 mr-2" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Picture and Basic Info */}
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              {userData?.profile_picture ? (
                <img 
                  src={userData.profile_picture} 
                  alt={userData.name || 'Profile'} 
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <UserIcon className="h-10 w-10 text-primary" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">
                {userData?.name || 'No name set'}
              </h2>
              <p className="text-muted-foreground flex items-center">
                <Mail className="h-4 w-4 mr-1" />
                {userData?.email}
              </p>
              <div className="flex items-center space-x-4 mt-1">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  userData?.email_verified 
                    ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                }`}>
                  {userData?.email_verified ? 'Verified' : 'Not Verified'}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                  {userData?.role || 'user'}
                </span>
              </div>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <Label htmlFor="name">Name</Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={editData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your name"
                />
              ) : (
                <p className="text-foreground mt-1">
                  {userData?.name || 'Not set'}
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={editData.phone_number || ''}
                  onChange={(e) => handleInputChange('phone_number', e.target.value)}
                  placeholder="Enter your phone number"
                />
              ) : (
                <p className="text-foreground mt-1 flex items-center">
                  {userData?.phone_number ? (
                    <>
                      <Phone className="h-4 w-4 mr-1" />
                      {userData.phone_number}
                    </>
                  ) : (
                    'Not set'
                  )}
                </p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <Label htmlFor="dob">Date of Birth</Label>
              {isEditing ? (
                <Input
                  id="dob"
                  type="date"
                  value={editData.date_of_birth || ''}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                />
              ) : (
                <p className="text-foreground mt-1 flex items-center">
                  {userData?.date_of_birth ? (
                    <>
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(userData.date_of_birth).toLocaleDateString()}
                    </>
                  ) : (
                    'Not set'
                  )}
                </p>
              )}
            </div>

            {/* Gender */}
            <div>
              <Label htmlFor="gender">Gender</Label>
              {isEditing ? (
                <select
                  id="gender"
                  value={editData.gender || ''}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background text-foreground"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              ) : (
                <p className="text-foreground mt-1">
                  {userData?.gender ? userData.gender.charAt(0).toUpperCase() + userData.gender.slice(1) : 'Not set'}
                </p>
              )}
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <Label htmlFor="address">Address</Label>
              {isEditing ? (
                <Input
                  id="address"
                  value={editData.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter your address"
                />
              ) : (
                <p className="text-foreground mt-1 flex items-center">
                  {userData?.address ? (
                    <>
                      <MapPin className="h-4 w-4 mr-1" />
                      {userData.address}
                    </>
                  ) : (
                    'Not set'
                  )}
                </p>
              )}
            </div>

            {/* Bio */}
            <div className="md:col-span-2">
              <Label htmlFor="bio">Bio</Label>
              {isEditing ? (
                <Textarea
                  id="bio"
                  value={editData.bio || ''}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell us about yourself"
                  rows={3}
                />
              ) : (
                <p className="text-foreground mt-1">
                  {userData?.bio || 'No bio set'}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Account Status</p>
              <p className="text-foreground font-medium">
                {userData?.status || 'active'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email Verified</p>
              <p className="text-foreground font-medium">
                {userData?.email_verified ? 'Yes' : 'No'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Two-Factor Auth</p>
              <p className="text-foreground font-medium">
                {userData?.two_factor_enabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Member Since</p>
              <p className="text-foreground font-medium">
                {userData?.created_at 
                  ? new Date(userData.created_at).toLocaleDateString()
                  : 'Unknown'
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Login</p>
              <p className="text-foreground font-medium">
                {userData?.last_login 
                  ? new Date(userData.last_login).toLocaleDateString()
                  : 'Never'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <ErrorDisplay error={error} onRetry={() => setError(null)} />
      )}
      </div>
    </AppLayout>
  )
}
