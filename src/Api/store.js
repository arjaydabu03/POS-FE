import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// Define a service using a base URL and expected endpoints
export const POSAPI = createApi({
  reducerPath: 'POSAPI',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://10.10.12.14:8000/api/',
    mode: "cors",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      headers.set("Accept", "application/json");
    },
  }),
  tagTypes: ["User"], // enables cache invalidation between user endpoints
  endpoints: (builder) => ({
    // Auth
    login: builder.mutation({
      query: (credentials) => ({
        url: "login",
        method: "POST",
        body: credentials,
      }),
    }),
    logout: builder.mutation({
      query: (credentials) => ({
        url: "logout",
        method: "POST",
        body: credentials,
      }),
    }),

    // User module
    user: builder.query({
      query: (params) => ({
        url: "user",
        method: "GET",
        params,
      }),
      providesTags: ["User"],
    }),
    createUser: builder.mutation({
      query: (body) => ({
        url: "user",
        method: "POST",
        body, 
      }),
      invalidatesTags: ["User"],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `user/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["User"],
    }),
    deleteRestoreUser: builder.mutation({
      query: (id) => ({
        url: `user/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),
    //Product module

    products: builder.query({
      query: (params) => ({
        url: "product",
        method: "GET",
        params,
      }),
      providesTags: ["Products"],
    }),

     createProduct: builder.mutation({
      query: (body) => ({
        url: "product",
        method: "POST",
        body, 
      }),
      invalidatesTags: ["Products"],
    }),

       updateProduct: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `product/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Products"],
    }),
    deleteRestoreProduct: builder.mutation({
      query: (id) => ({
        url: `product/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Products"],
    }),
     //miscellaneous module

    miscellaneous: builder.query({
      query: (params) => ({
        url: "misc",
        method: "GET",
        params,
      }),
      providesTags: ["Miscellaneous"],
    }),

     createMiscellaneous: builder.mutation({
      query: (body) => ({
        url: "misc",
        method: "POST",
        body, 
      }),
      invalidatesTags: ["Miscellaneous"],
    }),

       updateMiscellaneous: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `misc/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Miscellaneous"],
    }),
    deleteRestoreMiscellaneous: builder.mutation({
      query: (id) => ({
        url: `misc/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Miscellaneous"],

      //receiving module
    }),
      receiving: builder.query({
      query: (params) => ({
        url: "receiving",
        method: "GET",
        params,
      }),
      providesTags: ["Receiving"],
    }),

     createReceiving: builder.mutation({
      query: (body) => ({
        url: "receiving",
        method: "POST",
        body, 
      }),
      invalidatesTags: ["Receiving"],
    }),

       updateReceiving: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `receiving/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Receiving"],
    }),
    deleteRestoreReceiving: builder.mutation({
      query: (id) => ({
        url: `receiving/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Receiving"],
    }),
   //Category module

      category: builder.query({
      query: (params) => ({
        url: "category",
        method: "GET",
        params,
      }),
      providesTags: ["Category"],
    }),

     createCategory: builder.mutation({
      query: (body) => ({
        url: "category",
        method: "POST",
        body, 
      }),
      invalidatesTags: ["Category"],
    }),

       updateCategory: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `category/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Category"],
    }),
    deleteRestoreCategory: builder.mutation({
      query: (id) => ({
        url: `category/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Category"],
    }),
      //Uom module

      uom: builder.query({
      query: (params) => ({
        url: "uom",
        method: "GET",
        params,
      }),
      providesTags: ["Uom"],
    }),

     createUom: builder.mutation({
      query: (body) => ({
        url: "uom",
        method: "POST",
        body, 
      }),
      invalidatesTags: ["Uom"],
    }),

       updateUom: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `uom/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Uom"],
    }),
    deleteRestoreUom: builder.mutation({
      query: (id) => ({
        url: `uom/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Uom"],
    }),
       //Supplier module

      supplier: builder.query({
      query: (params) => ({
        url: "supplier",
        method: "GET",
        params,
      }),
      providesTags: ["Supplier"],
    }),

     createSupplier: builder.mutation({
      query: (body) => ({
        url: "supplier",
        method: "POST",
        body, 
      }),
      invalidatesTags: ["Supplier"],
    }),

       updateSupplier: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `supplier/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Supplier"],
    }),
    deleteRestoreSupplier: builder.mutation({
      query: (id) => ({
        url: `supplier/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Supplier"],
    }),
     //Move Order module

      MoveOrder: builder.query({
      query: (params) => ({
        url: "move_order",
        method: "GET",
        params,
      }),
      providesTags: ["MoveOrder"],
    }),

     createMoveOrder: builder.mutation({
      query: (body) => ({
        url: "move_order",
        method: "POST",
        body, 
      }),
      invalidatesTags: ["MoveOrder"],
    }),

       updateMoveOrder: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `move_order/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["MoveOrder"],
    }),
    deleteRestoreMoveOrder: builder.mutation({
      query: (id) => ({
        url: `move_order/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["MoveOrder"],
    }),
       //Miscellaneous Issue module

      MiscellaneousIssue: builder.query({
      query: (params) => ({
        url: "miscellaneous_issue",
        method: "GET",
        params,
      }),
      providesTags: ["MiscellaneousIssue"],
    }),

     createMiscellaneousIssue: builder.mutation({
      query: (body) => ({
        url: "miscellaneous_issue",
        method: "POST",
        body, 
      }),
      invalidatesTags: ["MiscellaneousIssue"],
    }),

       updateMiscellaneousIssue: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `miscellaneous_issue/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["MiscellaneousIssue"],
    }),
    deleteRestoreMiscellaneousIssue: builder.mutation({
      query: (id) => ({
        url: `miscellaneous_issue/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["MiscellaneousIssue"],
    }),
 //Mrp module

      Mrp: builder.query({
      query: (params) => ({
        url: "mrp",
        method: "GET",
        params,
      }),
      providesTags: ["Inventory"],
    }),

        //Transaction module

      Transaction: builder.query({
      query: (params) => ({
        url: "transaction",
        method: "GET",
        params,
      }),
      providesTags: ["TransactionModule"],
    }),

     createTransaction: builder.mutation({
      query: (body) => ({
        url: "transaction",
        method: "POST",
        body, 
      }),
      invalidatesTags: ["TransactionModule"],
    }),

       updateTransaction: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `transaction/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["TransactionModule"],
    }),
    deleteRestoreTransaction: builder.mutation({
      query: (id) => ({
        url: `transaction/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["TransactionModule"],
    }),
    
  }),

  
})

export const {
  useLoginMutation,
  useLogoutMutation,
  useUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteRestoreUserMutation,
  useProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteRestoreProductMutation,
  useReceivingQuery,
  useCreateReceivingMutation,
  useUpdateReceivingMutation,
  useDeleteRestoreReceivingMutation,
  useCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteRestoreCategoryMutation,
  useUomQuery,
  useCreateUomMutation,
  useUpdateUomMutation,
  useDeleteRestoreUomMutation,
  useSupplierQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteRestoreSupplierMutation,
  useMiscellaneousQuery,
  useCreateMiscellaneousMutation,
  useUpdateMiscellaneousMutation,
  useDeleteRestoreMiscellaneousMutation,
  useMoveOrderQuery,
  useCreateMoveOrderMutation,
  useUpdateMoveOrderMutation,
  useDeleteRestoreMoveOrderMutation,
  useMiscellaneousIssueQuery,
  useCreateMiscellaneousIssueMutation,
  useUpdateMiscellaneousIssueMutation,
  useDeleteRestoreMiscellaneousIssueMutation,
  useTransactionQuery,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteRestoreTransactionMutation,
  useMrpQuery,
} = POSAPI;