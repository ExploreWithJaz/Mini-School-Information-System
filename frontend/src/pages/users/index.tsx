'use client'
import { useEffect, useState } from 'react'
import { apiCall } from '@/lib/api'
import Modal from '@/components/modal'
import { useRouteProtection } from '@/hooks/useRouteProtection'

interface User {
  id: string
  email: string
  role: string
  createdDate: string
  updatedDate: string
}

interface UserApi {
  id: string
  email: string
  role: string
  createdDate?: string
  created_at?: string
  updatedDate?: string
  updated_at?: string
}

interface UserForm {
  email: string
  password: string
  role: string
}

const ROLES = ['Admin', 'Faculty', 'Student']

const capitalizeRole = (role: string) => {
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
}

export default function Users() {
  const { hasAccess } = useRouteProtection({ requiredRoles: ['Admin'] })
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  
  // State for modals
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  
  // Form states
  const [editForm, setEditForm] = useState<UserForm>({
    email: '',
    password: '',
    role: ''
  })
  const [addForm, setAddForm] = useState<UserForm>({
    email: '',
    password: '',
    role: 'Student'
  })

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiCall('/users')
      
      const usersList = (Array.isArray(response) ? response : response.data || []).map((u: UserApi) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        createdDate: u.createdDate || u.created_at || '',
        updatedDate: u.updatedDate || u.updated_at || ''
      })) as User[]

      setUsers(usersList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false)
      return
    }
    fetchUsers()
  }, [hasAccess])

  const filteredUsers = users.filter((user) => {
    const searchLower = search.toLowerCase()
    return (
      user.email.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower)
    )
  })

  const formatDate = (date: string) => {
    const parsed = new Date(date)
    return Number.isNaN(parsed.getTime())
      ? 'N/A'
      : parsed.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
  }

  const getRoleBadgeColor = (role: string) => {
    const capitalizedRole = capitalizeRole(role)
    switch (capitalizedRole) {
      case 'Admin':
        return 'bg-red-50 text-red-700 border-red-100'
      case 'Faculty':
        return 'bg-blue-50 text-blue-700 border-blue-100'
      case 'Student':
        return 'bg-green-50 text-green-700 border-green-100'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-100'
    }
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setEditForm({
      email: user.email,
      password: '',
      role: user.role
    })
    setIsEditOpen(true)
  }

  const openDeleteModal = (user: User) => {
    setSelectedUser(user)
    setIsDeleteOpen(true)
  }

  const handleEditUser = async () => {
    if (!selectedUser) return

    if (!editForm.email.trim()) {
      setError('Email is required')
      return
    }

    try {
      setIsSaving(true)
      setError(null)

      const updateData: Record<string, string> = {
        email: editForm.email.trim(),
        role: editForm.role.toLowerCase()
      }

      if (editForm.password.trim()) {
        updateData.password = editForm.password
      }

      const updated = (await apiCall(`/users/${selectedUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      })) as UserApi

      const normalizedUser: User = {
        id: updated.id,
        email: updated.email,
        role: updated.role,
        createdDate: updated.createdDate || updated.created_at || '',
        updatedDate: updated.updatedDate || updated.updated_at || ''
      }

      setUsers((prev) =>
        prev.map((user) => (user.id === updated.id ? normalizedUser : user))
      )

      setIsEditOpen(false)
      setSelectedUser(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      setIsDeleting(true)
      setError(null)

      await apiCall(`/users/${selectedUser.id}`, {
        method: 'DELETE'
      })

      setUsers((prev) => prev.filter((user) => user.id !== selectedUser.id))
      setIsDeleteOpen(false)
      setSelectedUser(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setIsDeleting(false)
    }
  }

  const resetAddForm = () => {
    setAddForm({
      email: '',
      password: '',
      role: 'Student'
    })
  }

  const handleAddUser = async () => {
    if (!addForm.email.trim() || !addForm.password.trim()) {
      setError('Email and password are required')
      return
    }

    try {
      setIsAdding(true)
      setError(null)

      const newUser = (await apiCall('/users', {
        method: 'POST',
        body: JSON.stringify({
          email: addForm.email.trim(),
          password: addForm.password,
          role: addForm.role.toLowerCase()
        })
      })) as UserApi

      const normalizedUser: User = {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        createdDate: newUser.createdDate || newUser.created_at || '',
        updatedDate: newUser.updatedDate || newUser.updated_at || ''
      }

      setUsers((prev) => [normalizedUser, ...prev])
      setIsAddOpen(false)
      resetAddForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add user')
    } finally {
      setIsAdding(false)
    }
  }

  const handleSelectAllUsers = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(new Set(users.map((u) => u.id)))
    } else {
      setSelectedUserIds(new Set())
    }
  }

  const handleSelectUser = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedUserIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedUserIds(newSelected)
  }

  const handleBulkDeleteUsers = async () => {
    if (selectedUserIds.size === 0) return

    try {
      setIsBulkDeleting(true)
      setError(null)

      const deletePromises = Array.from(selectedUserIds).map((id) =>
        apiCall(`/users/${id}`, { method: 'DELETE' })
      )

      await Promise.all(deletePromises)

      setUsers((prev) => prev.filter((user) => !selectedUserIds.has(user.id)))
      setSelectedUserIds(new Set())
      setBulkDeleteOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bulk delete users')
    } finally {
      setIsBulkDeleting(false)
    }
  }

  if (loading) return <div className='flex items-center justify-center min-h-screen'>Loading...</div>
  if (!hasAccess) return null

  return (
    <section className='bg-[#f5f6fb] min-h-screen p-5'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>User Management</h1>
        <p className='text-gray-500'>Manage system users and their roles</p>
      </div>

      {error && (
        <div className='mb-5 bg-red-50 border border-red-200 rounded-lg p-4'>
          <p className='text-red-700 text-sm font-medium'>{error}</p>
        </div>
      )}

      {/* Search and Actions Bar */}
      <div className='bg-white p-5 rounded-xl border border-gray-100 mb-5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center'>
        <div className='flex-1 w-full'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>Search Users</label>
          <input
            type='text'
            placeholder='Search by email or role...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all'
          />
        </div>
        <div className='flex gap-3 w-full sm:w-auto pt-2 sm:pt-6'>
          <button
            onClick={() => setIsAddOpen(true)}
            className='flex-1 sm:flex-none px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors'
          >
            + Add User
          </button>
          {selectedUserIds.size > 0 && (
            <button
              onClick={() => setBulkDeleteOpen(true)}
              className='flex-1 sm:flex-none px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors'
            >
              Delete ({selectedUserIds.size})
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className='bg-white rounded-xl border border-gray-100 overflow-hidden'>
        {filteredUsers.length === 0 ? (
          <div className='flex items-center justify-center p-10'>
            <div className='text-center'>
              <svg
                className='w-12 h-12 text-gray-300 mx-auto mb-3'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4.354a4 4 0 110 5.292M15 21H3v-2a6 6 0 0112 0v2zm0 0h6v-2a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' />
              </svg>
              <p className='text-gray-500 font-medium'>No users found</p>
              <p className='text-gray-400 text-sm'>Try adjusting your search</p>
            </div>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full border-collapse'>
              <thead>
                <tr className='bg-gray-50 border-b border-gray-100'>
                  <th className='px-6 py-3'>
                    <input
                      type='checkbox'
                      checked={selectedUserIds.size === filteredUsers.length && filteredUsers.length > 0}
                      onChange={(e) => handleSelectAllUsers(e.target.checked)}
                      className='w-4 h-4 rounded border-gray-300 cursor-pointer'
                    />
                  </th>
                  <th className='text-left text-[10px] font-medium uppercase tracking-widest text-gray-400 px-6 py-3'>Email</th>
                  <th className='text-left text-[10px] font-medium uppercase tracking-widest text-gray-400 px-6 py-3'>Role</th>
                  <th className='text-left text-[10px] font-medium uppercase tracking-widest text-gray-400 px-6 py-3'>Created</th>
                  <th className='text-left text-[10px] font-medium uppercase tracking-widest text-gray-400 px-6 py-3'>Updated</th>
                  <th className='text-center text-[10px] font-medium uppercase tracking-widest text-gray-400 px-6 py-3'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                      index === filteredUsers.length - 1 ? 'border-b-0' : ''
                    }`}
                  >
                    <td className='px-6 py-3'>
                      <input
                        type='checkbox'
                        checked={selectedUserIds.has(user.id)}
                        onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                        className='w-4 h-4 rounded border-gray-300 cursor-pointer'
                      />
                    </td>
                    <td className='px-6 py-3'>
                      <p className='text-sm font-medium text-gray-900'>{user.email}</p>
                    </td>
                    <td className='px-6 py-3'>
                      <span className={`text-xs font-medium px-3 py-1 rounded-full border ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className='px-6 py-3'>
                      <p className='text-sm text-gray-600'>{formatDate(user.createdDate)}</p>
                    </td>
                    <td className='px-6 py-3'>
                      <p className='text-sm text-gray-600'>{formatDate(user.updatedDate)}</p>
                    </td>
                    <td className='px-6 py-3'>
                      <div className='flex gap-2 justify-center'>
                        <button
                          onClick={() => openEditModal(user)}
                          className='px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors'
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDeleteModal(user)}
                          className='px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title='Edit User'
        footer={
          <div className='flex justify-end gap-3'>
            <button
              onClick={() => setIsEditOpen(false)}
              className='px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors'
            >
              Cancel
            </button>
            <button
              onClick={handleEditUser}
              disabled={isSaving}
              className='px-4 py-2 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 rounded-lg transition-colors'
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        }
      >
        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Email</label>
            <input
              type='email'
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Password (leave blank to keep current)</label>
            <input
              type='password'
              value={editForm.password}
              onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
              placeholder='Enter new password or leave blank'
              className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Role</label>
            <select
              value={editForm.role}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title='Delete User'
        footer={
          <div className='flex justify-end gap-3'>
            <button
              onClick={() => setIsDeleteOpen(false)}
              className='px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors'
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className='px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-lg transition-colors'
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        }
      >
        <p className='text-gray-600'>
          Are you sure you want to delete <span className='font-semibold'>{selectedUser?.email}</span>? This action cannot be undone.
        </p>
      </Modal>

      {/* Add User Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false)
          resetAddForm()
          setError(null)
        }}
        title='Add New User'
        footer={
          <div className='flex justify-end gap-3'>
            <button
              onClick={() => {
                setIsAddOpen(false)
                resetAddForm()
                setError(null)
              }}
              className='px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors'
            >
              Cancel
            </button>
            <button
              onClick={handleAddUser}
              disabled={isAdding}
              className='px-4 py-2 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 rounded-lg transition-colors'
            >
              {isAdding ? 'Creating...' : 'Create User'}
            </button>
          </div>
        }
      >
        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Email *</label>
            <input
              type='email'
              value={addForm.email}
              onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
              placeholder='user@example.com'
              className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Password *</label>
            <input
              type='password'
              value={addForm.password}
              onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
              placeholder='Enter password'
              className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Role</label>
            <select
              value={addForm.role}
              onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      {/* Bulk Delete Modal */}
      <Modal
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        title='Bulk Delete Users'
        footer={
          <div className='flex justify-end gap-3'>
            <button
              onClick={() => setBulkDeleteOpen(false)}
              className='px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors'
            >
              Cancel
            </button>
            <button
              onClick={handleBulkDeleteUsers}
              disabled={isBulkDeleting}
              className='px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-lg transition-colors'
            >
              {isBulkDeleting ? 'Deleting...' : 'Delete All'}
            </button>
          </div>
        }
      >
        <p className='text-gray-600'>
          Are you sure you want to delete <span className='font-semibold'>{selectedUserIds.size} user(s)</span>? This action cannot be undone.
        </p>
      </Modal>
    </section>
  )
}