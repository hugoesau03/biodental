import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { 
  Search, 
  Plus, 
  Package, 
  Edit2, 
  Trash2, 
  X,
  Check,
  AlertTriangle,
  Pill,
  ShoppingBag,
  Loader
} from 'lucide-react';
import Header from '../components/Layout/Header';
import Modal from '../components/Modal';
import { inventarioService } from '../services/api';

const PageContainer = styled.div`
  flex: 1;
  background: ${({ theme }) => theme.colors.background};
  padding-bottom: 100px;
  overflow-y: auto;
`;

const Content = styled.div`
  padding: 20px;
`;

const SearchSection = styled.div`
  margin-bottom: 20px;
`;

const SearchBar = styled.div`
  position: relative;
  display: flex;
  align-items: center;

  svg {
    position: absolute;
    left: 16px;
    width: 20px;
    height: 20px;
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  input {
    width: 100%;
    padding: 14px 16px 14px 48px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 12px;
    font-size: 15px;
    background: ${({ theme }) => theme.colors.white};
    transition: all 0.3s ease;

    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.primary};
    }

    &::placeholder {
      color: ${({ theme }) => theme.colors.textSecondary};
    }
  }
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  overflow-x: auto;
  padding-bottom: 4px;
`;

const Tab = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 20px;
  border: none;
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  background: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.white};
  color: ${({ $active, theme }) => $active ? 'white' : theme.colors.text};
  border: 1px solid ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.border};

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background: ${({ $active, theme }) => $active ? theme.colors.primaryDark : theme.colors.gray};
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
`;

const StatCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ $color, theme }) => $color || theme.colors.text};
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ProductsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ProductCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  gap: 16px;
`;

const ProductIcon = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: ${({ $type, theme }) => $type === 'medicamento' ? `${theme.colors.info}20` : `${theme.colors.primary}20`};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 24px;
    height: 24px;
    color: ${({ $type, theme }) => $type === 'medicamento' ? theme.colors.info : theme.colors.primary};
  }
`;

const ProductInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ProductName = styled.div`
  font-size: 15px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ProductDetails = styled.div`
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ProductPrice = styled.span`
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.primary};
`;

const StockBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  background: ${({ $low, theme }) => $low ? `${theme.colors.warning}20` : `${theme.colors.success}20`};
  color: ${({ $low, theme }) => $low ? theme.colors.warningText : theme.colors.successText};

  svg {
    width: 12px;
    height: 12px;
  }
`;

const ProductActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  background: ${({ theme }) => theme.colors.background};
  border: none;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray};
    color: ${({ $danger, theme }) => $danger ? theme.colors.dangerText : theme.colors.primary};
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const AddButton = styled.button`
  position: fixed;
  bottom: 100px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  svg {
    width: 24px;
    height: 24px;
  }

  &:hover {
    transform: scale(1.1);
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 16px;
  width: 100%;
  max-width: 450px;
  max-height: 70vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
`;

const CloseButton = styled.button`
  background: ${({ theme }) => theme.colors.background};
  border: none;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;

  &:hover {
    background: ${({ theme }) => theme.colors.gray};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const ModalBody = styled.div`
  padding: 20px;
  overflow-y: auto;
  flex: 1;
`;

const FormField = styled.div`
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  font-size: 14px;
  min-height: 80px;
  resize: vertical;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ModalActions = styled.div`
  padding: 16px 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  gap: 12px;
`;

const ModalButton = styled.button`
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.2s ease;
`;

const CancelButton = styled(ModalButton)`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
`;

const SaveButton = styled(ModalButton)`
  background: ${({ theme }) => theme.colors.primary};
  border: none;
  color: white;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${({ theme }) => theme.colors.textSecondary};

  svg {
    width: 48px;
    height: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }
`;

const Inventario = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'producto',
    precio: '',
    stock: '',
    stock_minimo: '',
    descripcion: ''
  });

  // Cargar productos
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await inventarioService.getAll({ search: searchQuery });
      if (response.success) {
        setProducts(response.data.productos);
      }
    } catch (err) {
      console.error('Error cargando inventario:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.nombre.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'todos' || 
                       activeTab === 'bajo_stock' ? product.stock <= product.stock_minimo :
                       product.tipo === activeTab;
    return matchesSearch && matchesTab;
  });

  // Estadísticas
  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.stock <= p.stock_minimo).length;
  const totalMedicamentos = products.filter(p => p.tipo === 'medicamento').length;
  const totalProductos = products.filter(p => p.tipo === 'producto').length;

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        nombre: product.nombre,
        tipo: product.tipo,
        precio: product.precio?.toString() || '',
        stock: product.stock?.toString() || '',
        stock_minimo: product.stock_minimo?.toString() || '',
        descripcion: product.descripcion || ''
      });
    } else {
      setEditingProduct(null);
      setFormData({
        nombre: '',
        tipo: 'producto',
        precio: '',
        stock: '',
        stock_minimo: '',
        descripcion: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleSave = async () => {
    if (!formData.nombre || !formData.precio || !formData.stock) return;

    setSaving(true);
    const productData = {
      nombre: formData.nombre,
      tipo: formData.tipo,
      precio: parseFloat(formData.precio),
      stock: parseInt(formData.stock),
      stock_minimo: parseInt(formData.stock_minimo) || 5,
      descripcion: formData.descripcion
    };

    try {
      if (editingProduct) {
        await inventarioService.update(editingProduct.uuid, productData);
      } else {
        await inventarioService.create(productData);
      }
      await fetchProducts();
      handleCloseModal();
    } catch (err) {
      console.error('Error guardando producto:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    
    try {
      await inventarioService.delete(productToDelete.uuid);
      await fetchProducts();
    } catch (err) {
      console.error('Error eliminando producto:', err);
    } finally {
      setShowDeleteModal(false);
      setProductToDelete(null);
    }
  };

  return (
    <PageContainer>
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar Producto"
        message={`¿Estás seguro de eliminar "${productToDelete?.nombre}"?`}
        type="danger"
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
      />

      <Header title="Inventario" showBack />
      
      <Content>
        <SearchSection>
          <SearchBar>
            <Search />
            <input
              type="text"
              placeholder="Buscar producto o medicamento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchBar>
        </SearchSection>

        <TabsContainer>
          <Tab $active={activeTab === 'todos'} onClick={() => setActiveTab('todos')}>
            <Package />
            Todos ({totalProducts})
          </Tab>
          <Tab $active={activeTab === 'medicamento'} onClick={() => setActiveTab('medicamento')}>
            <Pill />
            Medicamentos ({totalMedicamentos})
          </Tab>
          <Tab $active={activeTab === 'producto'} onClick={() => setActiveTab('producto')}>
            <ShoppingBag />
            Productos ({totalProductos})
          </Tab>
          <Tab $active={activeTab === 'bajo_stock'} onClick={() => setActiveTab('bajo_stock')}>
            <AlertTriangle />
            Bajo Stock ({lowStockProducts})
          </Tab>
        </TabsContainer>

        <StatsGrid>
          <StatCard>
            <StatValue>{totalProducts}</StatValue>
            <StatLabel>Total en inventario</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue $color={lowStockProducts > 0 ? '#F59E0B' : '#10B981'}>
              {lowStockProducts}
            </StatValue>
            <StatLabel>Stock bajo</StatLabel>
          </StatCard>
        </StatsGrid>

        <ProductsList>
          {filteredProducts.length === 0 ? (
            <EmptyState>
              <Package />
              <p>No hay productos en el inventario</p>
            </EmptyState>
          ) : (
            filteredProducts.map(product => (
              <ProductCard key={product.uuid}>
                <ProductIcon $type={product.tipo}>
                  {product.tipo === 'medicamento' ? <Pill /> : <ShoppingBag />}
                </ProductIcon>
                <ProductInfo>
                  <ProductName>{product.nombre}</ProductName>
                  <ProductDetails>
                    <ProductPrice>${product.precio}</ProductPrice>
                    <StockBadge $low={product.stock <= product.stock_minimo}>
                      {product.stock <= product.stock_minimo && <AlertTriangle />}
                      Stock: {product.stock}
                    </StockBadge>
                  </ProductDetails>
                </ProductInfo>
                <ProductActions>
                  <ActionButton onClick={() => handleOpenModal(product)}>
                    <Edit2 />
                  </ActionButton>
                  <ActionButton $danger onClick={() => handleDelete(product)}>
                    <Trash2 />
                  </ActionButton>
                </ProductActions>
              </ProductCard>
            ))
          )}
        </ProductsList>
      </Content>

      <AddButton onClick={() => handleOpenModal()}>
        <Plus />
      </AddButton>

      {/* Modal para agregar/editar producto */}
      {showModal && (
        <ModalOverlay onClick={handleCloseModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</ModalTitle>
              <CloseButton onClick={handleCloseModal}>
                <X />
              </CloseButton>
            </ModalHeader>
            <ModalBody>
              <FormField>
                <Label>Tipo</Label>
                <Select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                >
                  <option value="producto">Producto</option>
                  <option value="medicamento">Medicamento</option>
                </Select>
              </FormField>
              <FormField>
                <Label>Nombre</Label>
                <Input
                  type="text"
                  placeholder="Nombre del producto"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </FormField>
              <FormField>
                <Label>Precio ($)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.precio}
                  onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                />
              </FormField>
              <FormField>
                <Label>Stock Actual</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                />
              </FormField>
              <FormField>
                <Label>Stock Mínimo (alerta)</Label>
                <Input
                  type="number"
                  placeholder="5"
                  value={formData.stock_minimo}
                  onChange={(e) => setFormData({ ...formData, stock_minimo: e.target.value })}
                />
              </FormField>
              <FormField>
                <Label>Descripción</Label>
                <TextArea
                  placeholder="Descripción del producto..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </FormField>
            </ModalBody>
            <ModalActions>
              <CancelButton onClick={handleCloseModal}>
                Cancelar
              </CancelButton>
              <SaveButton onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : (editingProduct ? 'Guardar' : 'Agregar')}
              </SaveButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

export default Inventario;
